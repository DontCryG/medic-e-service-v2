import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { calculateSalary } from '../utils/salaryCalculations';
import { fetchAllRows } from '@/utils/supabasePagination';

export const salaryKeys = {
  all: ['salary'],
  summary: (startDate: Date, endDate: Date) => [...salaryKeys.all, 'summary', startDate.toISOString(), endDate.toISOString()],
};

export function useSalaryData(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: salaryKeys.summary(startDate, endDate),
    queryFn: async () => {
      // 1. Fetch all users with positions
      const usersQuery = supabase
        .from('users')
        .select(`
          discord_id,
          ic_name,
          positions (
            name,
            rank,
            oc_rate
          )
        `)
        .not('role', 'in', '("user","resigned")');
      const users = await fetchAllRows(usersQuery);

      // 2. Fetch all duty logs within date range
      const logsQuery = supabase
        .from('duty_logs')
        .select('*')
        .gte('clock_in', startDate.toISOString())
        .lte('clock_in', endDate.toISOString())
        .eq('status', 'completed');
      const logs = await fetchAllRows(logsQuery);

      // 3. Fetch all leave logs within date range
      const leaveQuery = supabase
        .from('leave_requests')
        .select('*')
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString());
      const leaveLogs = await fetchAllRows(leaveQuery);

      // 4. Fetch all story logs within date range
      const storyQuery = supabase
        .from('story_logs')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());
      const storyLogs = await fetchAllRows(storyQuery);

      // 5. Fetch queue manager logs within date range
      const queueQuery = supabase
        .from('queue_manager_logs')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());
      const queueLogs = await fetchAllRows(queueQuery);

      // 6. Fetch system settings
      const settingsQuery = supabase
        .from('system_settings')
        .select('*');
      const settings = await fetchAllRows(settingsQuery);
      
      const settingsMap = (settings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.type === 'number' ? Number(s.value) : s.value;
        return acc;
      }, {});

      // Ensure proper typing for calculateSalary
      const typedUsers = users.map(u => ({
        ...u,
        positions: Array.isArray(u.positions) ? u.positions[0] : u.positions
      }));

      // Calculate the results
      const results = calculateSalary(typedUsers as any, logs || [], leaveLogs || [], storyLogs || [], queueLogs || [], settingsMap);
      return results;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useUserDutyLogs(discordId: string | null, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [...salaryKeys.all, 'userDutyLogs', discordId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const query = supabase
        .from('duty_logs')
        .select('*')
        .eq('discord_id', discordId)
        .gte('clock_in', startDate.toISOString())
        .lte('clock_in', endDate.toISOString())
        .order('clock_in', { ascending: false });

      const data = await fetchAllRows(query);
      return data;
    },
    enabled: !!discordId && !!startDate && !!endDate,
  });
}
