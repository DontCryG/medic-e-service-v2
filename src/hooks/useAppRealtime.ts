import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dutyKeys } from '@/pages/DutySystem/hooks/useDutyQueries';
import { cleanupAllExpiredBreaks } from '@/pages/DutySystem/hooks/useDutyMutations';
import { useAuthStore } from '@/store/authStore';
import { create } from 'zustand';

interface RealtimeStore {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  isConnected: true,
  setIsConnected: (connected: boolean) => set({ isConnected: connected })
}));

export const broadcastForceSync = () => {
  const channel = supabase.getChannels().find(c => c.topic === 'realtime:app_realtime_global');
  if (channel && channel.state === 'joined') {
    channel.send({ type: 'broadcast', event: 'force_sync', payload: {} });
  }
};

export const broadcastForceReload = () => {
  const channel = supabase.getChannels().find(c => c.topic === 'realtime:app_realtime_global');
  if (channel && channel.state === 'joined') {
    channel.send({ type: 'broadcast', event: 'force_reload', payload: { by: 'admin', at: new Date().toISOString() } });
  }
};

/**
 * Enterprise Consolidated Realtime Manager
 * Multiplexes all table changes onto a single global WebSocket channel,
 * preventing connection exhaustion on Supabase Nano tier.
 * Implements debounced invalidation to prevent cascading query cancellations.
 */
export function useAppRealtime() {
  const queryClient = useQueryClient();
  const debounceMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const debouncedInvalidate = (queryKey: any[], delayMs = 120) => {
      const key = JSON.stringify(queryKey);
      const existing = debounceMap.current.get(key);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        debounceMap.current.delete(key);
        queryClient.invalidateQueries({ queryKey });
      }, delayMs);

      debounceMap.current.set(key, timeout);
    };

    const channel = supabase
      .channel('app_realtime_global')
      // 1. Duty logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_logs' }, () => {
        debouncedInvalidate(dutyKeys.all);
        debouncedInvalidate(['queue_users']);
        debouncedInvalidate(['salary']);
      })
      // 2. Users profile & position updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
        debouncedInvalidate(['users']);
        debouncedInvalidate(['queue_users']);
        debouncedInvalidate(['salary']);

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
        debouncedInvalidate(['positions']);
        debouncedInvalidate(['salary']);
      })
      // 4. System Settings (e.g. Volunteers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        debouncedInvalidate(['system_settings']);
        debouncedInvalidate(['queue_users']);
      })
      // 5. Queue Status (Doctor queue positions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_status' }, () => {
        debouncedInvalidate(['queue_users']);
      })
      // 6. Story Logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_logs' }, () => {
        debouncedInvalidate(['queue_users']);
        debouncedInvalidate(['salary']);
      })
      // 7. Queue Manager Logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_manager_logs' }, () => {
        debouncedInvalidate(['queue_users']);
        debouncedInvalidate(['salary']);
      })
      // 8. Leave Requests
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
        debouncedInvalidate(['leaves']);
        debouncedInvalidate(['salary']);
      })
      // 9. Accounting & Inventory logs
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_logs' }, () => {
        debouncedInvalidate(['accounting', 'finance']);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
        debouncedInvalidate(['accounting', 'inventory']);
      })
      // 10. Notifications
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        debouncedInvalidate(['notifications']);
      })
      // 11. Admin broadcast reload
      .on('broadcast', { event: 'force_reload' }, () => {
        window.location.reload();
      })
      .subscribe((status) => {
        useRealtimeStore.getState().setIsConnected(status === 'SUBSCRIBED');
      });

    // Periodic sweep for expired breaks (> 15 mins) to keep active roster and queues clean
    const breakSweepInterval = setInterval(() => {
      cleanupAllExpiredBreaks().then((count) => {
        if (count > 0) {
          debouncedInvalidate(dutyKeys.all);
          debouncedInvalidate(['queue_users']);
        }
      });
    }, 60000);

    return () => {
      clearInterval(breakSweepInterval);
      debounceMap.current.forEach(t => clearTimeout(t));
      debounceMap.current.clear();
      channel.unsubscribe().finally(() => {
        supabase.removeChannel(channel);
      });
    };
  }, [queryClient]);
}
