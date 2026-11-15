import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { broadcastForceReload } from './useAppRealtime';

export interface MaintenanceConfig {
  enabled: boolean;
  title: string;
  message: string;
  estimated_end?: string;
  updated_by?: string;
  updated_at?: string;
}

export const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  title: 'ระบบกำลังอยู่ระหว่างการพัฒนาและปรับปรุง',
  message: 'หน่วยงานแพทย์กำลังดำเนินการอัปเดตระบบ เพื่อเพิ่มประสิทธิภาพและความปลอดภัย กรุณากลับมาใช้งานใหม่อีกครั้งในภายหลัง',
  estimated_end: '',
  updated_by: ''
};

export const MAINTENANCE_QUERY_KEY = ['system_settings', 'maintenance_mode'];

export function useMaintenanceMode() {
  return useQuery({
    queryKey: MAINTENANCE_QUERY_KEY,
    queryFn: async (): Promise<MaintenanceConfig> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'maintenance_mode')
        .maybeSingle();

      if (error) {
        console.error('Error fetching maintenance_mode:', error);
        return DEFAULT_MAINTENANCE;
      }

      if (!data || !data.value) {
        return DEFAULT_MAINTENANCE;
      }

      try {
        const parsed = JSON.parse(data.value);
        return {
          ...DEFAULT_MAINTENANCE,
          ...parsed
        };
      } catch (err) {
        return {
          ...DEFAULT_MAINTENANCE,
          enabled: data.value === 'true'
        };
      }
    },
    staleTime: 10 * 1000,
  });
}

export function useSaveMaintenanceMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: MaintenanceConfig) => {
      const payload = {
        key: 'maintenance_mode',
        value: JSON.stringify(config),
        description: 'โหมดปิดปรับปรุงและพัฒนาระบบ (Maintenance Mode)',
        type: 'json',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('system_settings')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      queryClient.setQueryData(MAINTENANCE_QUERY_KEY, variables);
      
      // If enabling maintenance mode, optionally broadcast reload to push non-admins to maintenance screen immediately
      if (variables.enabled) {
        broadcastForceReload();
      }
    }
  });
}
