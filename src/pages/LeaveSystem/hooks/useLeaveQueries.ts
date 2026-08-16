import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const leaveKeys = {
  all: ['leaves'],
  myLeaves: (discordId: string) => [...leaveKeys.all, 'myLeaves', discordId],
  allLeaves: () => [...leaveKeys.all, 'allLeaves'],
};

export function useMyLeaves(discordId: string | undefined) {
  return useQuery({
    queryKey: leaveKeys.myLeaves(discordId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('discord_id', discordId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!discordId,
  });
}

export function useAllLeaves() {
  return useQuery({
    queryKey: leaveKeys.allLeaves(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          users!inner (
            ic_name,
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
