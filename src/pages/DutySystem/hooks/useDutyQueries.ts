import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Query keys
export const dutyKeys = {
  all: ['duty'],
  currentSession: (discordId: string) => [...dutyKeys.all, 'currentSession', discordId],
  liveUsers: () => [...dutyKeys.all, 'liveUsers'],
  history: (discordId: string, startDate: Date, endDate: Date, page: number, targetDiscordId?: string) => [...dutyKeys.all, 'history', discordId, targetDiscordId || '', startDate?.toISOString(), endDate?.toISOString(), page],
  myWeeklyStats: (discordId: string, startDate?: Date, endDate?: Date) => [...dutyKeys.all, 'myWeeklyStats', discordId, startDate?.toISOString() || '', endDate?.toISOString() || ''],
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
  const { user } = useAuthStore();
  
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
    enabled: !!user,
  });
}

// Hook: Fetch Duty History
export function useDutyHistory(
  discordId: string | undefined, 
  role: string | undefined, 
  startDate: Date, 
  endDate: Date, 
  page: number, 
  itemsPerPage = 50,
  targetDiscordId?: string
) {
  return useQuery({
    queryKey: dutyKeys.history(discordId!, startDate, endDate, page, targetDiscordId),
    queryFn: async () => {
      if (!discordId) return { data: [], count: 0 };
      
      
      
      let query = supabase
        .from('duty_logs')
        .select(`
          id, discord_id, clock_in, clock_out, total_break_minutes, total_duty_minutes, status, duty_type, granted_by,
          users!inner ( ic_name, role, positions (name) )
        `, { count: 'exact' })
        .eq('status', 'completed')
        .order('clock_in', { ascending: false });

      // Always only show the user's own history, regardless of their role
      if (targetDiscordId && targetDiscordId !== 'all') {
        query = query.eq('discord_id', targetDiscordId);
      } else if (!targetDiscordId) {
        query = query.eq('discord_id', discordId);
      }

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


export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
  
  const start = new Date(now);
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export interface UserWeeklyStats {
  totalMinutes: number;
  totalHours: number;
  remainingMinutes: number;
  completedLogsCount: number;
  normalMinutes: number;
  mentorMinutes: number;
  specialMinutes: number;
  startDate: Date;
  endDate: Date;
}

// Hook: Fetch Logged-in User's Weekly Duty Stats & Target Progress
export function useMyWeeklyDutyStats(
  discordId: string | undefined,
  startDate?: Date,
  endDate?: Date
) {
  const weekRange = getCurrentWeekRange();
  const actualStart = startDate || weekRange.start;
  const actualEnd = endDate || weekRange.end;

  return useQuery({
    queryKey: dutyKeys.myWeeklyStats(discordId!, actualStart, actualEnd),
    queryFn: async (): Promise<UserWeeklyStats> => {
      if (!discordId) {
        return {
          totalMinutes: 0,
          totalHours: 0,
          remainingMinutes: 0,
          completedLogsCount: 0,
          normalMinutes: 0,
          mentorMinutes: 0,
          specialMinutes: 0,
          startDate: actualStart,
          endDate: actualEnd,
        };
      }

      const start = new Date(actualStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(actualEnd);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('duty_logs')
        .select('id, total_duty_minutes, duty_type')
        .eq('discord_id', discordId)
        .eq('status', 'completed')
        .gte('clock_in', start.toISOString())
        .lte('clock_in', end.toISOString());

      if (error) throw error;

      const logs = data || [];
      let totalMinutes = 0;
      let normalMinutes = 0;
      let mentorMinutes = 0;
      let specialMinutes = 0;

      for (const log of logs) {
        const mins = Math.max(0, log.total_duty_minutes || 0);
        totalMinutes += mins;
        if (log.duty_type === 'mentor') {
          mentorMinutes += mins;
        } else if (log.duty_type === 'special') {
          specialMinutes += mins;
        } else {
          normalMinutes += mins;
        }
      }

      return {
        totalMinutes,
        totalHours: Math.floor(totalMinutes / 60),
        remainingMinutes: totalMinutes % 60,
        completedLogsCount: logs.length,
        normalMinutes,
        mentorMinutes,
        specialMinutes,
        startDate: actualStart,
        endDate: actualEnd,
      };
    },
    enabled: !!discordId,
  });
}
