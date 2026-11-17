import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { showErrorAlert } from '@/utils/alert';
import toast from 'react-hot-toast';
import { leaveKeys } from './useLeaveQueries';
import { useAuthStore } from '@/store/authStore';

interface CreateLeaveParams {
  discord_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const profile = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async (params: CreateLeaveParams) => {
      // 1. Try Rust Backend validation & creation
      try {
        await api.leave.request(params);
        return;
      } catch (err: any) {
        if (err.statusCode && err.statusCode < 500) {
          throw err;
        }
        console.warn('Rust backend leave request failed, falling back to direct supabase:', err);
      }

      // 2. Direct Supabase Fallback
      const { error } = await supabase
        .from('leave_requests')
        .insert([params]);
      
      if (error) throw error;

      // Send notification to admins
      await supabase.from('notifications').insert({
        discord_id: 'ALL_ADMINS',
        title: 'ใบลาใหม่ (รออนุมัติ)',
        message: `${profile?.ic_name || 'บุคลากร'} ยื่นใบลา${params.leave_type === 'vacation' ? 'พักร้อน' : params.leave_type === 'resign' ? 'ออก' : 'กิจ'} เหตุผล: ${params.reason}`,
        type: 'leave_request',
        link: '/leave'
      });
    },
    onSuccess: () => {
      toast.success('ยื่นใบลาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถยื่นใบลาได้');
    }
  });
}

interface UpdateLeaveStatusParams {
  id: string;
  status: 'approved' | 'rejected';
  approved_by?: string;
  admin_comment?: string;
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  const profile = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async ({ id, status, approved_by, admin_comment }: UpdateLeaveStatusParams) => {
      // 1. Try Rust Backend review
      try {
        await api.leave.review({ id, status, admin_comment });
        return;
      } catch (err: any) {
        if (err.statusCode && err.statusCode < 500) {
          throw err;
        }
        console.warn('Rust backend leave review failed, falling back to direct supabase:', err);
      }

      // 2. Direct Supabase Fallback
      const approverName = approved_by || profile?.ic_name || 'ผู้ดูแลระบบ';
      
      const updatePayload: any = { status };
      if (approverName) updatePayload.approved_by = approverName;
      if (admin_comment !== undefined) updatePayload.admin_comment = admin_comment;

      let { data: updatedLeave, error } = await supabase
        .from('leave_requests')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error && error.code === '42703') {
        const fallbackRes = await supabase
          .from('leave_requests')
          .update({ status })
          .eq('id', id)
          .select('*')
          .single();
        if (fallbackRes.error) throw fallbackRes.error;
        updatedLeave = fallbackRes.data;
      } else if (error) {
        throw error;
      }

      if (!updatedLeave) return;

      const notifTitle = status === 'approved' 
        ? 'ใบลาของคุณได้รับการอนุมัติแล้ว' 
        : 'ใบลาของคุณไม่ได้รับการอนุมัติ';
      
      const notifMessage = status === 'approved'
        ? `คำขอลาของคุณได้รับการอนุมัติโดย ${approverName} เรียบร้อยแล้ว`
        : `คำขอลาของคุณถูกปฏิเสธโดย ${approverName}${admin_comment ? ` (เหตุผล: ${admin_comment})` : ''}`;

      await supabase.from('notifications').insert({
        discord_id: updatedLeave.discord_id,
        title: notifTitle,
        message: notifMessage,
        type: 'leave_update',
        link: '/leave'
      });

      if (status === 'approved' && updatedLeave.leave_type === 'resign') {
        const { error: userError } = await supabase
          .from('users')
          .update({ role: 'resigned', position_id: null })
          .eq('discord_id', updatedLeave.discord_id);
          
        if (userError) throw userError;
      }
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'อนุมัติการลาสำเร็จ' : 'ปฏิเสธการลาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถทำรายการได้');
    }
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Try Rust Backend delete
      try {
        await api.leave.delete(id);
        return;
      } catch (err: any) {
        if (err.statusCode && err.statusCode < 500) {
          throw err;
        }
        console.warn('Rust backend leave delete failed, falling back to direct supabase:', err);
      }

      // 2. Direct Supabase Fallback
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('ลบคำขอลาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถลบคำขอลาได้');
    }
  });
}
