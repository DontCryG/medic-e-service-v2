import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export function useUsersRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('realtime_users')
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
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*, positions(*)')
        .order('ic_name');
        
      if (error) throw error;
      
      const map = (data || []).reduce((acc: Record<string, any>, user) => {
        acc[user.discord_id] = user;
        return acc;
      }, {});
      
      return { raw: data || [], map };
    },
    staleTime: 30 * 1000, 
    gcTime: 10 * 60 * 1000,
  });
};
