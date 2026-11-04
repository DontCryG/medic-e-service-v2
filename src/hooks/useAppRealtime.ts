import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dutyKeys } from '@/pages/DutySystem/hooks/useDutyQueries';
import { useAuthStore } from '@/store/authStore';

export const broadcastForceSync = () => {
  const channels = supabase.getChannels();
  const existingChannel = channels.find(c => c.topic === 'realtime:global_broadcast_channel');
  
  if (existingChannel && existingChannel.state === 'joined') {
    existingChannel.send({ type: 'broadcast', event: 'force_sync', payload: {} });
  } else {
    const newChannel = supabase.channel('global_broadcast_channel');
    newChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        newChannel.send({ type: 'broadcast', event: 'force_sync', payload: {} });
      }
    });
  }
};

export const broadcastForceReload = () => {
  const channels = supabase.getChannels();
  const existingChannel = channels.find(c => c.topic === 'realtime:global_broadcast_channel');
  
  if (existingChannel && existingChannel.state === 'joined') {
    existingChannel.send({ type: 'broadcast', event: 'force_reload', payload: { by: 'admin', at: new Date().toISOString() } });
  } else {
    const newChannel = supabase.channel('global_broadcast_channel');
    newChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        newChannel.send({ type: 'broadcast', event: 'force_reload', payload: { by: 'admin', at: new Date().toISOString() } });
      }
    });
  }
};

export function useAppRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('app_realtime_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: dutyKeys.all });
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
        queryClient.invalidateQueries({ queryKey: ['users'] });

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['positions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['system_settings'] });
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      })
      .on('broadcast', { event: 'force_reload' }, () => {
        window.location.reload();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
