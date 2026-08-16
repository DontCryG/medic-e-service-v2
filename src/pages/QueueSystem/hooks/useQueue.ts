import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { QueueUser, QueueStatus } from '../types';

export function useQueue(currentUserId: string | undefined) {
  const queryClient = useQueryClient();
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Fetch active users (on_duty or on_break)
  const { data: queueUsers = [], isLoading, error } = useQuery({
    queryKey: ['queue_users'],
    queryFn: async () => {
      // 1. Get all users currently on duty
      const { data: dutyLogs, error: dutyError } = await supabase
        .from('duty_logs')
        .select(`
          id, discord_id, status, clock_in, last_break_start, total_break_minutes,
          users (
            ic_name,
            avatar_url,
            positions (
              name,
              rank
            )
          )
        `)
        .in('status', ['on_duty', 'on_break'])
        .order('clock_in', { ascending: false });

      if (dutyError) throw dutyError;

      const activeDiscordIds = Array.from(new Set(dutyLogs?.map(d => d.discord_id) || []));

      if (activeDiscordIds.length === 0) return [];

      // 2. Fetch their queue statuses
      const { data: queueStatuses, error: queueError } = await supabase
        .from('queue_status')
        .select('*')
        .in('discord_id', activeDiscordIds);

      if (queueError) throw queueError;

      const statusMap = new Map<string, QueueStatus>(
        queueStatuses?.map(s => [s.discord_id, s as QueueStatus]) || []
      );

      // 3. Map back to our QueueUser interface
      const users: QueueUser[] = dutyLogs?.map(log => {
        const anyUser = log.users as any; // typing workaround
        return {
          discord_id: log.discord_id,
          ic_name: anyUser?.ic_name || 'Unknown',
          avatar_url: anyUser?.avatar_url || null,
          is_current_user: log.discord_id === currentUserId,
          status_record: statusMap.get(log.discord_id) || null,
        };
      }) || [];

      // Sort: current user first, then by name
      users.sort((a, b) => {
        if (a.is_current_user) return -1;
        if (b.is_current_user) return 1;
        return a.ic_name.localeCompare(b.ic_name);
      });

      return users;
    },
    enabled: !!currentUserId,
    refetchInterval: 30000,
  });

  // Subscribe to Realtime changes
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('queue_status_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_status' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['queue_users'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['queue_users'] });
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]);

  return { queueUsers, isLoading, error, realtimeConnected };
}
