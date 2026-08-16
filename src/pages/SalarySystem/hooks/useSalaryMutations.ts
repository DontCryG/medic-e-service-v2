import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { salaryKeys } from './useSalaryQueries';

export function useUpdateDutyLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
      const { data, error } = await supabase
        .from('duty_logs')
        .update(payload)
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("ไม่สามารถแก้ไขข้อมูลได้ อาจเพราะไม่มีสิทธิ์ (RLS) หรือไม่พบข้อมูล");
    },
    onSuccess: () => {
      toast.success('แก้ไขประวัติเวรสำเร็จ');
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error: any) => {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: error.message });
    }
  });
}

export function useDeleteDutyLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('duty_logs')
        .delete()
        .eq('id', id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("ไม่สามารถลบข้อมูลได้ อาจเพราะไม่มีสิทธิ์ (RLS) หรือไม่พบข้อมูล");
    },
    onSuccess: () => {
      toast.success('ลบประวัติเวรสำเร็จ');
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
    onError: (error: any) => {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: error.message });
    }
  });
}
