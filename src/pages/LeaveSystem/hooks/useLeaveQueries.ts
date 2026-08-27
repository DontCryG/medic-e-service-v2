import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export const leaveKeys = {
  all: ['leaves'],
  myLeaves: (discordId: string) => [...leaveKeys.all, 'myLeaves', discordId],
  allLeaves: () => [...leaveKeys.all, 'allLeaves'],
};

export function useMyLeaves(discordId: string | undefined) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: leaveKeys.myLeaves(discordId || ''),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('discord_id', discordId as string)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    });
}

export function useAllLeaves() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: leaveKeys.allLeaves(),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          users!inner (
            ic_name,
            avatar_url,
            role,
            positions (
              name,
              rank
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure proper typing for populated users
      return data.map(req => ({
        ...req,
        users: Array.isArray(req.users) ? req.users[0] : req.users
      }));
    }
  });
}


