import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { fetchAllRows } from '@/utils/supabasePagination';
import { useAuthStore } from '@/store/authStore';
import { calculateSalary } from '@/pages/SalarySystem/utils/salaryCalculations';
import type { DateRangePreset, AnalyticsSummary } from '../types';
import { 
  getDateRangeFromPreset, 
  computeHeatmapMatrix, 
  computeTrendData, 
  computePositionBreakdown, 
  computeExecutiveKPIs 
} from '../utils/analyticsCalculations';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (preset: string, startIso: string, endIso: string) => 
    [...analyticsKeys.all, 'summary', preset, startIso, endIso] as const,
};

export function useAnalyticsData(
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date
) {
  const { user } = useAuthStore();
  const { current, previous } = getDateRangeFromPreset(preset, customStart, customEnd);

  return useQuery({
    enabled: !!user,
    queryKey: analyticsKeys.summary(preset, current.start.toISOString(), current.end.toISOString()),
    staleTime: 60 * 1000, // 1 minute fresh cache
    queryFn: async (): Promise<AnalyticsSummary> => {
      // 1. Try High-Performance Rust Backend first
      try {
        const data = await api.analytics.summary(current.start.toISOString(), current.end.toISOString());
        if (data) {
          return {
            ...data,
            dateRange: {
              startDate: new Date(data.dateRange.startDate),
              endDate: new Date(data.dateRange.endDate),
              daysCount: data.dateRange.daysCount,
            }
          };
        }
      } catch (err) {
        console.warn('Rust backend analytics failed, using client-side fallback:', err);
      }

      // 2. Client-side fallback for resilience
      const usersQuery = supabase
        .from('users')
        .select(`
          discord_id,
          ic_name,
          role,
          positions (
            name,
            rank,
            oc_rate,
            ic_rate
          )
        `)
        .not('role', 'in', '("user","resigned")');
      const users = await fetchAllRows(usersQuery);

      // 2. Fetch System Settings
      const settingsQuery = supabase.from('system_settings').select('*');
      const settingsRows = await fetchAllRows(settingsQuery);
      const settingsMap = (settingsRows || []).reduce((acc: any, s: any) => {
        acc[s.key] = s.type === 'number' ? Number(s.value) : s.value;
        return acc;
      }, {});

      // 3. Current Period Duty Logs
      const currentLogsQuery = supabase
        .from('duty_logs')
        .select('*')
        .gte('clock_in', current.start.toISOString())
        .lte('clock_in', current.end.toISOString());
      const currentLogs = await fetchAllRows(currentLogsQuery);

      // 4. Current Period Leave Requests
      const currentLeaveQuery = supabase
        .from('leave_requests')
        .select('*')
        .gte('start_date', current.start.toISOString())
        .lte('start_date', current.end.toISOString());
      const currentLeave = await fetchAllRows(currentLeaveQuery);

      // 5. Current Period Queue Manager Logs
      const currentQueueQuery = supabase
        .from('queue_manager_logs')
        .select('*')
        .gte('start_time', current.start.toISOString())
        .lte('start_time', current.end.toISOString());
      const currentQueue = await fetchAllRows(currentQueueQuery);

      // 6. Previous Period Data (For Growth Comparison)
      const prevLogsQuery = supabase
        .from('duty_logs')
        .select('*')
        .gte('clock_in', previous.start.toISOString())
        .lte('clock_in', previous.end.toISOString());
      const prevLogs = await fetchAllRows(prevLogsQuery);

      const prevLeaveQuery = supabase
        .from('leave_requests')
        .select('*')
        .gte('start_date', previous.start.toISOString())
        .lte('start_date', previous.end.toISOString());
      const prevLeave = await fetchAllRows(prevLeaveQuery);

      const prevQueueQuery = supabase
        .from('queue_manager_logs')
        .select('*')
        .gte('start_time', previous.start.toISOString())
        .lte('start_time', previous.end.toISOString());
      const prevQueue = await fetchAllRows(prevQueueQuery);

      // Format typed users for calculateSalary
      const typedUsers = (users || []).map((u: any) => ({
        ...u,
        positions: Array.isArray(u.positions) ? u.positions[0] : u.positions
      }));

      // Calculate Current Period Salaries
      const currentSalaryResults = calculateSalary(
        typedUsers as any,
        currentLogs || [],
        currentLeave || [],
        [],
        currentQueue || [],
        settingsMap
      );

      // Calculate Previous Period Salaries
      const prevSalaryResults = calculateSalary(
        typedUsers as any,
        prevLogs || [],
        prevLeave || [],
        [],
        prevQueue || [],
        settingsMap
      );

      // Calculate 7x24 Heatmap Matrix & Shortage Insights
      const { matrix: heatmapMatrix, insights } = computeHeatmapMatrix(
        currentLogs || [],
        current.start,
        current.end
      );

      // Calculate Trend Chart Points (Daily or Weekly)
      const trendData = computeTrendData(
        currentLogs || [],
        currentSalaryResults,
        current.start,
        current.end
      );

      // Calculate Position Budget Breakdown
      const positionBreakdown = computePositionBreakdown(
        currentSalaryResults,
        typedUsers
      );

      // Calculate Executive KPIs
      const kpis = computeExecutiveKPIs(
        currentSalaryResults,
        prevSalaryResults,
        typedUsers.length
      );

      const daysCount = Math.max(1, Math.round((current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        kpis,
        heatmapMatrix,
        trendData,
        positionBreakdown,
        insights,
        dateRange: {
          startDate: current.start,
          endDate: current.end,
          daysCount
        }
      };
    }
  });
}
