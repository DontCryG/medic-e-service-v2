import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { dutyKeys } from './useDutyQueries';
import { salaryKeys } from '../../SalarySystem/hooks/useSalaryQueries';

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discordId: string) => {
      const { error } = await supabase
        .from('duty_logs')
        .insert([{
          discord_id: discordId,
          status: 'on_duty',
          clock_in: new Date().toISOString()
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
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'เข้าเวรไม่สำเร็จ: ' + err.message });
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
      } else {
        const breakStart = new Date(currentSession.last_break_start).getTime();
        const now = new Date().getTime();
        const breakMinutes = Math.floor((now - breakStart) / 60000);
        
        const { error } = await supabase
          .from('duty_logs')
          .update({ 
            status: 'on_duty',
            total_break_minutes: currentSession.total_break_minutes + breakMinutes,
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
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'เปลี่ยนสถานะไม่สำเร็จ: ' + err.message });
    }
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentSession: any) => {
      if (!currentSession) throw new Error("No active session");
      
      let finalBreakMinutes = currentSession.total_break_minutes;
      const clockOutTime = new Date();
      
      if (currentSession.status === 'on_break') {
        const breakStart = new Date(currentSession.last_break_start).getTime();
        finalBreakMinutes += Math.floor((clockOutTime.getTime() - breakStart) / 60000);
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
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ออกเวรไม่สำเร็จ: ' + err.message });
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
      } else {
        const breakStart = new Date(session.last_break_start).getTime();
        const now = new Date().getTime();
        const breakMinutes = Math.floor((now - breakStart) / 60000);
        
        const { error } = await supabase
          .from('duty_logs')
          .update({ 
            status: 'on_duty',
            total_break_minutes: session.total_break_minutes + breakMinutes,
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
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    }
  });
}

export function useAdminClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: any) => {
      let finalBreakMinutes = session.total_break_minutes;
      const clockOutTime = new Date();
      
      if (session.status === 'on_break') {
        const breakStart = new Date(session.last_break_start).getTime();
        finalBreakMinutes += Math.floor((clockOutTime.getTime() - breakStart) / 60000);
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
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    }
  });
}
