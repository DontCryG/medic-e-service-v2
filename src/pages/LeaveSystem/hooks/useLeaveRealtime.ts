import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { leaveKeys } from './useLeaveQueries';

export function useLeaveRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const suffix = Date.now().toString() + Math.random().toString().slice(2, 6);
    const subscription = supabase
      .channel(`leave-system-changes-${suffix}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leave_requests'
      }, () => {
        // Invalidate all leave queries to trigger a refetch automatically
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);
}
