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

/**
 * Enterprise Consolidated Realtime Manager
 * Multiplexes all table changes onto a single global WebSocket channel,
 * preventing connection exhaustion on Supabase Nano tier.
 */
export function useAppRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('app_realtime_global')
      // 1. Duty logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: dutyKeys.all });
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
        queryClient.invalidateQueries({ queryKey: ['salary'] });
      })
      // 2. Users profile & position updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
        queryClient.invalidateQueries({ queryKey: ['salary'] });

        // Update authStore if the active user profile changed
        const { user: currentUser } = useAuthStore.getState();
        if (currentUser && payload.new && (payload.new as any).discord_id === currentUser.discord_id) {
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
      // 3. Positions (Ranks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['positions'] });
        queryClient.invalidateQueries({ queryKey: ['salary'] });
      })
      // 4. System Settings (e.g. Volunteers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['system_settings'] });
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      })
      // 5. Queue Status (Doctor queue positions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_status' }, () => {
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      })
      // 6. Story Logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
        queryClient.invalidateQueries({ queryKey: ['salary'] });
      })
      // 7. Queue Manager Logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_manager_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['queue_users'] });
        queryClient.invalidateQueries({ queryKey: ['salary'] });
      })
      // 8. Leave Requests
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leaves'] });
        queryClient.invalidateQueries({ queryKey: ['salary'] });
      })
      // 9. Accounting & Inventory logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['accounting', 'finance'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['accounting', 'inventory'] });
      })
      // 10. Admin broadcast reload
      .on('broadcast', { event: 'force_reload' }, () => {
        window.location.reload();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
