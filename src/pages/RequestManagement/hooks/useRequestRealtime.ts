import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { requestKeys } from './useRequestQueries';

export function useRequestRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('realtime_general_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'general_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: requestKeys.all });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
