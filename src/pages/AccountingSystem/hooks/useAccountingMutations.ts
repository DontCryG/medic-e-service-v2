import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { accountingKeys } from './useAccountingQueries';
import Swal from 'sweetalert2';

export function useAddFinanceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      discord_id: string;
      type: 'income' | 'expense';
      amount: number;
      description: string;
    }) => {
      const { data: result, error } = await supabase
        .from('accounting_logs')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.finance });
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message
      });
    }
  });
}

export function useAddInventoryLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      discord_id: string;
      type: 'receive' | 'disburse';
      item_name: string;
      quantity: number;
      description: string;
      metadata?: any;
    }) => {
      const { data: result, error } = await supabase
        .from('inventory_logs')
        .insert([{
          discord_id: data.discord_id,
          type: data.type,
          item_name: data.item_name,
          quantity: data.quantity,
          description: data.description,
          metadata: data.metadata || null
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.inventory });
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message
      });
    }
  });
}
