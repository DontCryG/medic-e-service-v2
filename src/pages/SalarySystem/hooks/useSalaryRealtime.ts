import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { salaryKeys } from './useSalaryQueries';

export function useSalaryRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('salary-system-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'duty_logs'
      }, () => {
        queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'story_logs'
      }, () => {
        queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users'
      }, () => {
        queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'positions'
      }, () => {
        queryClient.invalidateQueries({ queryKey: salaryKeys.all });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
