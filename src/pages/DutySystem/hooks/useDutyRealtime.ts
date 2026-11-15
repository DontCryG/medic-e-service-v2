import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dutyKeys } from './useDutyQueries';

/**
 * Dedicated Page-Level Duty Realtime Hook
 * Ensures instant updates for duty logs, breaks, and shifts while on the Duty System page.
 */
export function useDutyRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('duty_system_page_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: dutyKeys.all });
          queryClient.invalidateQueries({ queryKey: ['queue_users'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
