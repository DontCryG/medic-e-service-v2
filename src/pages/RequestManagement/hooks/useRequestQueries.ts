import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export const requestKeys = {
  all: ['general_requests'],
  user: (discordId: string) => [...requestKeys.all, discordId],
};

export function useGeneralRequests() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'director' || user?.role === 'management';

  return useQuery({
    queryKey: isAdmin ? requestKeys.all : requestKeys.user(user?.discord_id || ''),
    queryFn: async () => {
      let query = supabase
        .from('general_requests')
        .select(`
          *,
          users (
            ic_name,
            positions (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && user?.discord_id) {
        query = query.eq('discord_id', user.discord_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Clean up position array if it comes as an array
      const cleanedData = data?.map(req => ({
        ...req,
        users: {
          ...req.users,
          positions: Array.isArray(req.users?.positions) 
            ? req.users.positions[0] 
            : req.users?.positions
        }
      }));
      
      return cleanedData || [];
    },
    enabled: !!user,
  });
}
