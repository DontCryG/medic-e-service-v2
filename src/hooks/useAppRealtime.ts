import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dutyKeys } from '@/pages/DutySystem/hooks/useDutyQueries';
import { useAuthStore } from '@/store/authStore';

// Global broadcast channel for manual syncs
export const globalBroadcastChannel = supabase.channel('global_sync_broadcast');

export function useAppRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen to changes on duty_logs
    const dutyLogsSubscription = supabase
      .channel('public:duty_logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: dutyKeys.all });
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    // Listen to changes on users (Personnel System)
    const usersSubscription = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
        queryClient.invalidateQueries(); // Invalidate all queries globally for users
        
        // Check if the current user was updated
        const { user: currentUser } = useAuthStore.getState();
        if (currentUser && payload.new && (payload.new as any).discord_id === currentUser.discord_id) {
          // Fetch updated full profile
          const { data } = await supabase
            .from('users')
            .select('*, positions(*)')
            .eq('discord_id', currentUser.discord_id)
            .maybeSingle();
            
          if (data) {
            useAuthStore.getState().login({
              discord_id: data.discord_id,
              ic_name: data.ic_name,
              position_id: data.position_id,
              role: data.role,
              position: Array.isArray(data.positions) ? data.positions[0] : data.positions
            });
          }
        }
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    // Listen to changes on positions
    const positionsSubscription = supabase
      .channel('public:positions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => {
        queryClient.invalidateQueries();
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    // Listen to changes on system_settings
    const settingsSubscription = supabase
      .channel('public:system_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['system_settings'] });
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') { queryClient.invalidateQueries(); } });

    // Listen to manual broadcasts
    globalBroadcastChannel
      .on('broadcast', { event: 'force_sync' }, () => {
        queryClient.invalidateQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dutyLogsSubscription);
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(positionsSubscription);
      supabase.removeChannel(settingsSubscription);
      supabase.removeChannel(globalBroadcastChannel);
    };
  }, [queryClient]);
}
