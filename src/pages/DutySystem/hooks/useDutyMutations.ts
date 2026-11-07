import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { showErrorAlert, enterpriseSwal } from '@/utils/alert';
import toast from 'react-hot-toast';
import { dutyKeys } from './useDutyQueries';
import { salaryKeys } from '../../SalarySystem/hooks/useSalaryQueries';
import { saveManagerHistory } from '../../QueueSystem/hooks/useQueueMutations';

/**
 * Clears queue status, active story, and queue manager role for a doctor.
 */
export async function cleanupUserQueueAndStory(discordId: string) {
  try {
    const { data: queueData } = await supabase
      .from('queue_status')
      .select('*')
      .eq('discord_id', discordId)
      .maybeSingle();

    if (queueData) {
      // 1. If doctor was queue manager and has start time, persist their manager logs
      if (queueData.status === 'manager' && queueData.manager_start_time) {
        try {
          await saveManagerHistory(discordId, queueData.manager_start_time);
        } catch (mErr) {
          console.error('Failed to save manager history during cleanup:', mErr);
        }
      }

      // 2. Completely delete or reset queue_status
      const { error: delErr } = await supabase
        .from('queue_status')
        .delete()
        .eq('discord_id', discordId);

      if (delErr) {
        await supabase
          .from('queue_status')
          .update({
            status: null,
            manager_start_time: null,
            story_target_time: null,
            story_gang_1: null,
            story_gang_2: null,
            story_type: null,
            story_locked: false,
            story_premium: null,
            updated_at: new Date().toISOString()
          })
          .eq('discord_id', discordId);
      }
    }

    // 3. Clear volunteer doctor status if present
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'queue_volunteers')
      .maybeSingle();

    if (setting?.value) {
      let volunteers: any[] = [];
      try { volunteers = JSON.parse(setting.value); } catch { /* ignore */ }
      let changed = false;
      volunteers.forEach((v: any) => {
        if (v.id === discordId && v.status) {
          v.status = null;
          changed = true;
        }
      });
      if (changed) {
        await supabase.from('system_settings').upsert({
          key: 'queue_volunteers',
          value: JSON.stringify(volunteers),
          description: 'ข้อมูลหมออาสา',
          type: 'json'
        });
      }
    }
  } catch (err) {
    console.error('Error in cleanupUserQueueAndStory:', err);
  }
}

/**
 * Executes auto clock-out for a single session whose break exceeded 15 minutes.
 */
export async function autoClockOutSession(session: any): Promise<boolean> {
  if (!session || !session.id || !session.last_break_start) return false;

  const breakStartTime = new Date(session.last_break_start).getTime();
  const maxBreakMs = 15 * 60 * 1000; // 15 minutes
  const clockOutTime = new Date(breakStartTime + maxBreakMs);
  const prevBreakMinutes = Number(session.total_break_minutes) || 0;
  const finalBreakMinutes = Number((prevBreakMinutes + 15).toFixed(4));

  const clockInTime = new Date(session.clock_in).getTime();
  const totalDutyMinutes = Math.floor(Math.max(0, (clockOutTime.getTime() - clockInTime) / 60000 - finalBreakMinutes));

  let handled = false;

  if (totalDutyMinutes <= 0) {
    const { data } = await supabase
      .from('duty_logs')
      .delete()
      .eq('id', session.id)
      .eq('status', 'on_break')
      .select();

    if (data && data.length > 0) handled = true;
  } else {
    const { data } = await supabase
      .from('duty_logs')
      .update({
        status: 'completed',
        clock_out: clockOutTime.toISOString(),
        total_break_minutes: finalBreakMinutes,
        total_duty_minutes: totalDutyMinutes
      })
      .eq('id', session.id)
      .eq('status', 'on_break')
      .select();

    if (data && data.length > 0) handled = true;
  }

  if (handled) {
    await cleanupUserQueueAndStory(session.discord_id);
    return true;
  }

  return false;
}

/**
 * Sweeps and auto clocks out all expired breaks (> 15 mins) across the entire roster.
 */
export async function cleanupAllExpiredBreaks(): Promise<number> {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: expiredSessions, error } = await supabase
      .from('duty_logs')
      .select('id, discord_id, clock_in, last_break_start, total_break_minutes')
      .eq('status', 'on_break')
      .lt('last_break_start', fifteenMinutesAgo);

    if (error || !expiredSessions || expiredSessions.length === 0) return 0;

    let count = 0;
    for (const session of expiredSessions) {
      const ok = await autoClockOutSession(session);
      if (ok) count++;
    }
    return count;
  } catch (err) {
    console.error('Error in cleanupAllExpiredBreaks:', err);
    return 0;
  }
}

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discordId: string) => {
      const { data: existing } = await supabase
        .from('duty_logs')
        .select('id')
        .eq('discord_id', discordId)
        .in('status', ['on_duty', 'on_break'])
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('You already have an active duty session.');
      }

      const { error } = await supabase.from('duty_logs').insert([{
        discord_id: discordId,
        status: 'on_duty',
        clock_in: new Date().toISOString(),
        total_break_minutes: 0
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('เข้าเวรสำเร็จ');
      queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', 'เข้าเวรไม่สำเร็จ: ' + err.message);
    }
  });
}

export function useToggleBreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentSession: any) => {
      if (!currentSession) throw new Error("No active session");
      
      if (currentSession.status === 'on_duty') {
        const { error } = await supabase
          .from('duty_logs')
          .update({ 
            status: 'on_break',
            last_break_start: new Date().toISOString()
          })
          .eq('id', currentSession.id);
        if (error) throw error;

        // Clear queue status (story, manager, queue) when pausing duty
        await cleanupUserQueueAndStory(currentSession.discord_id);
      } else {
        const breakStart = new Date(currentSession.last_break_start).getTime();
        const now = Date.now();
        // Exact fractional minutes calculation ensures no seconds jump upon resuming duty
        const breakMinutes = Math.max(0, (now - breakStart) / 60000);
        const currentBreak = Number(currentSession.total_break_minutes) || 0;
        const newTotalBreak = Number((currentBreak + breakMinutes).toFixed(4));
        
        const { error } = await supabase
          .from('duty_logs')
          .update({ 
            status: 'on_duty',
            total_break_minutes: newTotalBreak,
            last_break_start: null
          })
          .eq('id', currentSession.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('เปลี่ยนสถานะสำเร็จ');
      queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', 'เปลี่ยนสถานะไม่สำเร็จ: ' + err.message);
    }
  });
}

export function useAutoClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: any) => {
      const ok = await autoClockOutSession(session);
      return { success: ok };
    },
    onSuccess: (data) => {
      if (data?.success) {
        enterpriseSwal.fire({
          title: 'ระบบออกเวรอัตโนมัติ',
          text: 'คุณพักเบรกเกินกำหนด 15 นาที ระบบได้ทำการออกเวรให้อัตโนมัติ และเคลียร์สถานะคิว/สตอรี่ที่ค้างอยู่เรียบร้อยแล้ว',
          icon: 'warning',
          confirmButtonColor: '#7e22ce',
          confirmButtonText: 'รับทราบ'
        });
      }
      queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
    onError: (err: any) => {
      console.error('Auto clock-out error:', err);
    }
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentSession: any) => {
      if (!currentSession) throw new Error("No active session");
      
      let finalBreakMinutes = Number(currentSession.total_break_minutes) || 0;
      const clockOutTime = new Date();
      
      if (currentSession.status === 'on_break' && currentSession.last_break_start) {
        const breakStart = new Date(currentSession.last_break_start).getTime();
        // Exact break duration capped at 15 minutes
        const currentBreakMinutes = Math.min(15, Math.max(0, (clockOutTime.getTime() - breakStart) / 60000));
        finalBreakMinutes = Number((finalBreakMinutes + currentBreakMinutes).toFixed(4));
      }

      const clockInTime = new Date(currentSession.clock_in).getTime();
      const totalDutyMinutes = Math.floor(Math.max(0, (clockOutTime.getTime() - clockInTime) / 60000 - finalBreakMinutes));

      if (totalDutyMinutes === 0) {
        const { error } = await supabase.from('duty_logs').delete().eq('id', currentSession.id);
        if (error) throw error;
        return { deleted: true };
      }

      const { error } = await supabase
        .from('duty_logs')
        .update({ 
          status: 'completed',
          clock_out: clockOutTime.toISOString(),
          total_break_minutes: finalBreakMinutes,
          total_duty_minutes: totalDutyMinutes
        })
        .eq('id', currentSession.id);
      
      if (error) throw error;
      return { deleted: false };
    },
    onSuccess: (data) => {
      if (data?.deleted) {
        toast.success('ยกเลิกการเข้าเวรเนื่องจากเวลาไม่ถึง 1 นาที');
      } else {
        toast.success('ออกเวรสำเร็จ');
      }
      queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', 'ออกเวรไม่สำเร็จ: ' + err.message);
    }
  });
}

export function useAdminToggleBreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: any) => {
      if (session.status === 'on_duty') {
        const { error } = await supabase
          .from('duty_logs')
          .update({ 
            status: 'on_break',
            last_break_start: new Date().toISOString()
          })
          .eq('id', session.id);
        if (error) throw error;

        // Clear queue status (story, manager, queue) when admin pauses duty
        await cleanupUserQueueAndStory(session.discord_id);
      } else {
        const breakStart = new Date(session.last_break_start).getTime();
        const now = Date.now();
        const breakMinutes = Math.max(0, (now - breakStart) / 60000);
        const currentBreak = Number(session.total_break_minutes) || 0;
        const newTotalBreak = Number((currentBreak + breakMinutes).toFixed(4));
        
        const { error } = await supabase
          .from('duty_logs')
          .update({ 
            status: 'on_duty',
            total_break_minutes: newTotalBreak,
            last_break_start: null
          })
          .eq('id', session.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('เปลี่ยนสถานะการพักเบรกสำเร็จ');
      queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', err.message);
    }
  });
}

export function useAdminClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: any) => {
      let finalBreakMinutes = Number(session.total_break_minutes) || 0;
      const clockOutTime = new Date();
      
      if (session.status === 'on_break' && session.last_break_start) {
        const breakStart = new Date(session.last_break_start).getTime();
        const currentBreakMinutes = Math.min(15, Math.max(0, (clockOutTime.getTime() - breakStart) / 60000));
        finalBreakMinutes = Number((finalBreakMinutes + currentBreakMinutes).toFixed(4));
      }

      const clockInTime = new Date(session.clock_in).getTime();
      const totalDutyMinutes = Math.floor(Math.max(0, (clockOutTime.getTime() - clockInTime) / 60000 - finalBreakMinutes));

      if (totalDutyMinutes === 0) {
        const { error } = await supabase.from('duty_logs').delete().eq('id', session.id);
        if (error) throw error;
        return { deleted: true };
      }

      const { error } = await supabase
        .from('duty_logs')
        .update({ 
          status: 'completed',
          clock_out: clockOutTime.toISOString(),
          total_break_minutes: finalBreakMinutes,
          total_duty_minutes: totalDutyMinutes
        })
        .eq('id', session.id);
        
      if (error) throw error;
      return { deleted: false };
    },
    onSuccess: (data) => {
      if (data?.deleted) {
        toast.success('ลบการเข้าเวรของแอดมินเนื่องจากเวลาไม่ถึง 1 นาที');
      } else {
        toast.success('บังคับออกเวรสำเร็จ');
      }
      queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', err.message);
    }
  });
}
