import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/utils/supabasePagination';
import { useAuthStore } from '@/store/authStore';
import type { SalaryResult } from '../utils/salaryCalculations';

export const salaryKeys = {
  all: ['salary'],
  summary: (startDate: Date, endDate: Date) => [...salaryKeys.all, 'summary', startDate.toISOString(), endDate.toISOString()],
};

export function useSalaryData(startDate: Date, endDate: Date) {
  const { user } = useAuthStore();
  return useQuery({
    enabled: !!user && !!startDate && !!endDate,
    queryKey: salaryKeys.summary(startDate, endDate),
    queryFn: async () => {
      // PHASE 1 UPGRADE: Call the Database RPC instead of fetching 5 tables
      const { data, error } = await (supabase as any).rpc('calculate_salary_summary', {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      });

      if (error) {
        console.error("RPC Error calculating salary:", error);
        throw new Error(error.message);
      }

      return (data || []) as SalaryResult[];
    },
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