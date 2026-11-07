import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useUsersRealtime() {
  // Realtime changes are multiplexed globally by useAppRealtime
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
      
      // Filter out fake volunteer users (discord_id should be numeric 17-20 chars)
      const fetchedData = (data || []).filter(u => /^\d{17,20}$/.test(u.discord_id));
      
      const map = fetchedData.reduce((acc: Record<string, any>, userItem) => {
        acc[userItem.discord_id] = userItem;
        return acc;
      }, {});
      
      return { raw: fetchedData, map };
    },
    enabled: !!user,
    staleTime: 30 * 1000, 
    gcTime: 10 * 60 * 1000,
  });
};
