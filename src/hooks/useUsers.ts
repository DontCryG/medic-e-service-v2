import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useUsersRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const suffix = Date.now().toString() + Math.random().toString().slice(2, 6);
    const channel = supabase
      .channel(`realtime_users_${suffix}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export const useUsers = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*, positions(*)')
        .order('ic_name');
        
      if (error) throw error;
      
      const map = (data || []).reduce((acc: Record<string, any>, userItem) => {
        acc[userItem.discord_id] = userItem;
        return acc;
      }, {});
      
      return { raw: data || [], map };
    },
    enabled: !!user,
    staleTime: 30 * 1000, 
    gcTime: 10 * 60 * 1000,
  });
};
