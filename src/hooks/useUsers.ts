import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
