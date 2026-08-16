import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { leaveKeys } from './useLeaveQueries';

interface CreateLeaveParams {
  discord_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export function useCreateLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateLeaveParams) => {
      const { error } = await supabase
        .from('leave_requests')
        .insert([params]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('ยื่นใบลาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
    onError: (err: any) => {
      Swal.fire('ข้อผิดพลาด', err.message || 'ไม่สามารถยื่นใบลาได้', 'error');
    }
  });
}

interface UpdateLeaveStatusParams {
  id: string;
  status: 'approved' | 'rejected';
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateLeaveStatusParams) => {
      const { data: updatedLeave, error } = await supabase
        .from('leave_requests')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;

      // If approved and it is a resign request, update user role to 'resigned' and position_id to null
      if (status === 'approved' && updatedLeave.leave_type === 'resign') {
        const { error: userError } = await supabase
          .from('users')
          .update({ role: 'resigned', position_id: null })
          .eq('discord_id', updatedLeave.discord_id);
          
        if (userError) throw userError;
      }
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'อนุมัติใบลางานสำเร็จ' : 'ปฏิเสธใบลางานสำเร็จ');
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      Swal.fire('ข้อผิดพลาด', err.message || 'ไม่สามารถทำรายการได้', 'error');
    }
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('ยกเลิกการลาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
    onError: (err: any) => {
      Swal.fire('ข้อผิดพลาด', err.message || 'ไม่สามารถยกเลิกการลาได้', 'error');
    }
  });
}
