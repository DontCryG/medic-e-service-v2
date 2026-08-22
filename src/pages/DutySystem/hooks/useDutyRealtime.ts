import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dutyKeys } from './useDutyQueries';

export function useDutyRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const suffix = Date.now().toString() + Math.random().toString().slice(2, 6);
    const subscription = supabase
      .channel(`live-duty-${suffix}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'duty_logs'
      }, () => {
        // Invalidate all duty queries to trigger a refetch automatically
        queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);
}
