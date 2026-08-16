import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dutyKeys } from './useDutyQueries';

export function useDutyRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('live-duty')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'duty_logs'
      }, () => {
        // Invalidate all duty queries to trigger a refetch automatically
        queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);
}
