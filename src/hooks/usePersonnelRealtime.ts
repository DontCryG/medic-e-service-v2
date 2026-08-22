import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePersonnelRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const suffix = Date.now().toString() + Math.random().toString().slice(2, 6);
    const channel = supabase
      .channel(`personnel-system-changes-${suffix}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users'
      }, () => {
        // Invalidate users query to trigger a refetch automatically
        queryClient.invalidateQueries({ queryKey: ['users'] });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'positions'
      }, () => {
        // Invalidate positions query
        queryClient.invalidateQueries({ queryKey: ['positions'] });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
