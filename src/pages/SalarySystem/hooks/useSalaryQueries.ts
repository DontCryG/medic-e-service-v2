import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { fetchAllRows } from '@/utils/supabasePagination';
import { useAuthStore } from '@/store/authStore';
import { calculateSalary, type SalaryResult } from '../utils/salaryCalculations';

export const salaryKeys = {
  all: ['salary'],
  summary: (startDate: Date, endDate: Date) => [...salaryKeys.all, 'summary', startDate.toISOString(), endDate.toISOString()],
};

export function useSalaryData(startDate: Date, endDate: Date) {
  const { user } = useAuthStore();
  return useQuery({
    enabled: !!user && !!startDate && !!endDate,
    queryKey: salaryKeys.summary(startDate, endDate),
    queryFn: async (): Promise<SalaryResult[]> => {
      // 1. Try High-Performance Rust Backend first
      try {
        const data = await api.salary.calculate(startDate.toISOString(), endDate.toISOString());
        if (data?.results) {
          return data.results;
        }
      } catch (err) {
        console.warn('Rust backend salary calculation failed, using fallback:', err);
      }

      // 2. Client-side fallback for resilience
      const usersQuery = supabase
        .from('users')
        .select(`
          discord_id,
          ic_name,
          positions (
            name,
            rank,
            oc_rate,
            ic_rate
          )
        `)
        .not('role', 'in', '("user","resigned")');
      const users = await fetchAllRows(usersQuery);

      const logsQuery = supabase
        .from('duty_logs')
        .select('*')
        .gte('clock_in', startDate.toISOString())
        .lte('clock_in', endDate.toISOString())
        .eq('status', 'completed');
      const logs = await fetchAllRows(logsQuery);

      const leaveQuery = supabase
        .from('leave_requests')
        .select('*')
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString());
      const leaveLogs = await fetchAllRows(leaveQuery);

      const queueQuery = supabase
        .from('queue_manager_logs')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());
      const queueLogs = await fetchAllRows(queueQuery);

      const settingsQuery = supabase
        .from('system_settings')
        .select('*');
      const settings = await fetchAllRows(settingsQuery);
      
      const settingsMap = (settings || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.type === 'number' ? Number(s.value) : s.value;
        return acc;
      }, {});

      const typedUsers = users.map(u => ({
        ...u,
        positions: Array.isArray(u.positions) ? u.positions[0] : u.positions
      }));

      return calculateSalary(
        typedUsers as any,
        logs || [],
        leaveLogs || [],
        [],
        queueLogs || [],
        settingsMap
      );
    },
    staleTime: 60 * 1000,
  });
}

export function useUserDutyLogs(discordId: string | null, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [...salaryKeys.all, 'userDutyLogs', discordId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const query = supabase
        .from('duty_logs')
        .select('*')
        .eq('discord_id', discordId as string)
        .gte('clock_in', startDate.toISOString())
        .lte('clock_in', endDate.toISOString())
        .order('clock_in', { ascending: false });

      const data = await fetchAllRows(query);
      return data;
    },
    enabled: !!discordId && !!startDate && !!endDate,
  });
}
