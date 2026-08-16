import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Query keys
export const dutyKeys = {
  all: ['duty'],
  currentSession: (discordId: string) => [...dutyKeys.all, 'currentSession', discordId],
  liveUsers: () => [...dutyKeys.all, 'liveUsers'],
  history: (discordId: string, startDate: Date, endDate: Date, page: number) => [...dutyKeys.all, 'history', discordId, startDate?.toISOString(), endDate?.toISOString(), page],
};

// Hook: Fetch Current Session
export function useCurrentSession(discordId: string | undefined) {
  return useQuery({
    queryKey: dutyKeys.currentSession(discordId!),
    queryFn: async () => {
      if (!discordId) return null;
      const { data, error } = await supabase
        .from('duty_logs')
        .select('id, discord_id, status, clock_in, total_break_minutes, last_break_start')
        .eq('discord_id', discordId)
        .in('status', ['on_duty', 'on_break'])
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data || null;
    },
    enabled: !!discordId,
  });
}

// Hook: Fetch Live Users (Everyone on duty or break)
export function useLiveUsers() {
  return useQuery({
    queryKey: dutyKeys.liveUsers(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('duty_logs')
        .select(`
          id, discord_id, status, clock_in, last_break_start, total_break_minutes,
          users (
            ic_name,
            positions (
              name,
              rank
            )
          )
        `)
        .in('status', ['on_duty', 'on_break'])
        .order('clock_in', { ascending: false });

      console.log('useLiveUsers query result:', data, error);

      if (error) throw error;
      
      // Transform data so UI gets user.position instead of user.positions.name
      return (data || []).map(item => ({
        ...item,
        users: item.users ? {
          ...item.users,
          position: (item.users as any).positions?.name || '-',
          rank: (item.users as any).positions?.rank || 99
        } : null
      }));
    },
  });
}

// Hook: Fetch Duty History
export function useDutyHistory(discordId: string | undefined, role: string | undefined, startDate: Date, endDate: Date, page: number, itemsPerPage = 50) {
  return useQuery({
    queryKey: dutyKeys.history(discordId!, startDate, endDate, page),
    queryFn: async () => {
      if (!discordId) return { data: [], count: 0 };
      
      
      
      let query = supabase
        .from('duty_logs')
        .select(`
          id, discord_id, clock_in, clock_out, total_break_minutes, total_duty_minutes, status,
          users!inner ( ic_name, role, positions (name) )
        `, { count: 'exact' })
        .eq('status', 'completed')
        .order('clock_in', { ascending: false });

      // Always only show the user's own history, regardless of their role
      query = query.eq('discord_id', discordId);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query = query.gte('clock_in', start.toISOString());
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('clock_in', end.toISOString());
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data || [], count: count || 0 };
    },
    enabled: !!discordId,
  });
}
