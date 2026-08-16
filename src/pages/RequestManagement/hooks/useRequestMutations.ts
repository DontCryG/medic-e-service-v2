import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requestKeys } from './useRequestQueries';
import Swal from 'sweetalert2';

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRequest: {
      discord_id: string;
      title: string;
      description: string;
    }) => {
      // request_type will default to 'other' or we can pass it, but since the user wanted free text,
      // we can just store the free text in `title` and maybe set request_type to 'general'
      const { data, error } = await supabase
        .from('general_requests')
        .insert([{
          discord_id: newRequest.discord_id,
          request_type: 'general', 
          title: newRequest.title,
          description: newRequest.description,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      Swal.fire({
        icon: 'success',
        title: 'ส่งคำร้องสำเร็จ',
        text: 'ระบบได้รับคำร้องของคุณแล้ว',
        timer: 1500,
        showConfirmButton: false
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งคำร้องได้'
      });
    }
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, adminComment }: { id: string, status: 'approved' | 'rejected', adminComment?: string }) => {
      const { data, error } = await supabase
        .from('general_requests')
        .update({ 
          status, 
          admin_comment: adminComment,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      Swal.fire({
        icon: 'success',
        title: 'อัปเดตสถานะสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถอัปเดตสถานะได้'
      });
    }
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('general_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      Swal.fire({
        icon: 'success',
        title: 'ลบคำร้องสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถลบคำร้องได้'
      });
    }
  });
}
