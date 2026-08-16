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
      const [dutyLogsRes, volsRes] = await Promise.all([
        supabase
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
          .order('clock_in', { ascending: true }),
        supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'queue_volunteers')
          .maybeSingle()
      ]);

      const dutyLogs = dutyLogsRes.data || [];
      const dutyError = dutyLogsRes.error;
      if (dutyError) throw dutyError;

      const activeDiscordIds = Array.from(new Set(dutyLogs.map(d => d.discord_id)));
      
      let statusMap = new Map<string, QueueStatus>();
      if (activeDiscordIds.length > 0) {
        const { data: queueStatuses, error: queueError } = await supabase
          .from('queue_status')
          .select('*')
          .in('discord_id', activeDiscordIds);
        
        if (queueError) throw queueError;
        statusMap = new Map<string, QueueStatus>(
          queueStatuses?.map(s => [s.discord_id, s as QueueStatus]) || []
        );
      }

      // Parse volunteers
      let volunteers = [];
      if (volsRes.data?.value) {
        try {
          volunteers = JSON.parse(volsRes.data.value);
        } catch (e) {}
      }

      // Map normal users
      let users: QueueUser[] = dutyLogs.map(log => {
        const anyUser = log.users as any;
        return {
          discord_id: log.discord_id,
          ic_name: anyUser?.ic_name || 'Unknown',
          avatar_url: anyUser?.avatar_url || null,
          is_current_user: log.discord_id === currentUserId,
          status_record: statusMap.get(log.discord_id) || null,
        };
      });

      // Map volunteers
      const volunteerUsers: QueueUser[] = volunteers.map((v: any) => ({
        discord_id: v.id,
        ic_name: v.name + ' (อาสา)',
        avatar_url: null,
        is_current_user: false,
        is_volunteer: true,
        status_record: {
          discord_id: v.id,
          status: v.status,
          manager_start_time: null,
          story_target_time: null,
          story_gang_1: null,
          story_gang_2: null,
          story_type: null,
          story_locked: false,
          story_premium: null,
          updated_at: new Date().toISOString()
        }
      }));

      users = [...users, ...volunteerUsers];

      // Sort logic
      users.sort((a, b) => {
        // 1. Current user always at top (unless they are unavailable? let's keep them top always)
        if (a.is_current_user) return -1;
        if (b.is_current_user) return 1;
        
        // 2. "Unavailable" always goes to the bottom
        const aUnavail = a.status_record?.status === 'unavailable';
        const bUnavail = b.status_record?.status === 'unavailable';
        if (aUnavail && !bUnavail) return 1;
        if (!aUnavail && bUnavail) return -1;
        
        // 3. Keep original clock_in ascending order (or volunteers at bottom if tie)
        if (a.is_volunteer && !b.is_volunteer) return 1;
        if (!a.is_volunteer && b.is_volunteer) return -1;
        
        if (!a.is_volunteer && !b.is_volunteer) {
          const idxA = dutyLogs.findIndex(l => l.discord_id === a.discord_id);
          const idxB = dutyLogs.findIndex(l => l.discord_id === b.discord_id);
          return idxA - idxB;
        }
        return 0;
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings', filter: 'key=eq.queue_volunteers' },
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
