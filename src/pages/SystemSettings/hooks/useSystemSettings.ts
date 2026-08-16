import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SystemSetting {
  key: string;
  value: string;
  description: string;
  type: string;
  created_at?: string;
  updated_at?: string;
}

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');
      if (error) throw error;
      return (data as SystemSetting[]) || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useSaveSystemSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: SystemSetting) => {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          type: setting.type,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system_settings'] }),
  });
};

export const useDeleteSystemSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from('system_settings').delete().eq('key', key);
      if (error) throw error;
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system_settings'] }),
  });
};
