import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { accountingKeys } from './useAccountingQueries';

export function useAccountingRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const financeChannel = supabase
      .channel('realtime_accounting_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: accountingKeys.finance });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    const inventoryChannel = supabase
      .channel('realtime_inventory_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: accountingKeys.inventory });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    return () => {
      supabase.removeChannel(financeChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, [queryClient]);
}
