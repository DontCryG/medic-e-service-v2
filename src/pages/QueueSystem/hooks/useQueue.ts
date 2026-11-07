import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useRealtimeStore } from '@/hooks/useAppRealtime';
import type { QueueUser, QueueStatus } from '../types';

export function useQueue(currentUserId: string | undefined) {
  const realtimeConnected = useRealtimeStore((state) => state.isConnected);

  // Fetch active users (only on_duty doctors, excluding doctors on break)
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
          .eq('status', 'on_duty')
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
        } catch { /* eslint-disable-next-line no-empty */ }
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
      const volunteerUsers: QueueUser[] = volunteers.map((v: any) => {
        // Fallback: parse timestamp from ID (e.g. vol_1701234567890_123) if added_at is missing
        let addedAt = v.added_at;
        if (!addedAt) {
          const match = v.id?.match(/vol_(\d+)_/);
          if (match) {
            addedAt = new Date(parseInt(match[1])).toISOString();
          } else {
            addedAt = new Date().toISOString(); // ultimate fallback
          }
        }
        
        return {
          discord_id: v.id,
          ic_name: v.name + ' (อาสา)',
          avatar_url: null,
          is_current_user: false,
          is_volunteer: true,
          volunteer_added_at: addedAt,
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
            remark: null,
            updated_at: addedAt
          }
        };
      });

      users = [...users, ...volunteerUsers];

      // Sort users
      users.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          'manager': 1,
          'attending': 2,
          'in_case': 3,
          'queued': 4,
          'story': 5,
        };

        const orderA = a.status_record?.status ? (statusOrder[a.status_record.status] || 6) : 6;
        const orderB = b.status_record?.status ? (statusOrder[b.status_record.status] || 6) : 6;

        // 1. Sort by Status Priority
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // 2. Sort chronologically by "join time"
        const getJoinTime = (user: QueueUser) => {
          if (user.is_volunteer) {
            return user.volunteer_added_at ? new Date(user.volunteer_added_at).getTime() : 0;
          } else {
            const log = dutyLogs.find(l => l.discord_id === user.discord_id);
            return log ? new Date(log.clock_in).getTime() : 0;
          }
        };

        return getJoinTime(a) - getJoinTime(b);
      });

      return users;
    },
    enabled: !!currentUserId,
    refetchInterval: 30000,
    staleTime: 5 * 1000,
    refetchOnWindowFocus: false,
  });

  return { queueUsers, isLoading, error, realtimeConnected };
}
