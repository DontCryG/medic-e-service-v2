import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { accountingKeys } from './useAccountingQueries';
import { showErrorAlert } from '@/utils/alert';
import toast from 'react-hot-toast';

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
        .insert([{
          discord_id: data.discord_id,
          type: data.type,
          amount: data.amount,
          description: data.description
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.finance });
      toast.success('บันทึกรายการสำเร็จ');
    },
    onError: (error: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', error.message);
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
          metadata: data.metadata || {}
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.inventory });
      toast.success('บันทึกพัสดุสำเร็จ');
    },
    onError: (error: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', error.message);
    }
  });
}

export function useUpdateFinanceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      type: 'income' | 'expense';
      amount: number;
      description: string;
    }) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('accounting_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.finance });
      toast.success('อัปเดตรายการสำเร็จ');
    },
    onError: (error: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', error.message);
    }
  });
}

export function useDeleteFinanceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounting_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.finance });
      toast.success('ลบรายการสำเร็จ');
    },
    onError: (error: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', error.message);
    }
  });
}

export function useUpdateInventoryLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      type: 'receive' | 'disburse';
      item_name: string;
      quantity: number;
      description: string;
      metadata?: any;
    }) => {
      const { id, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('inventory_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.inventory });
      toast.success('อัปเดตพัสดุสำเร็จ');
    },
    onError: (error: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', error.message);
    }
  });
}

export function useDeleteInventoryLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountingKeys.inventory });
      toast.success('ลบรายการพัสดุสำเร็จ');
    },
    onError: (error: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', error.message);
    }
  });
}
