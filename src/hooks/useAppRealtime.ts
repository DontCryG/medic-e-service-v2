import { useEffect } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
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
  isConnected: false,
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

// Singleton channel & active query client reference
let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let activeQueryClient: QueryClient | null = null;

export function initGlobalRealtimeChannel(queryClient: QueryClient) {
  activeQueryClient = queryClient;

  // If already active or joining, reuse existing channel
  if (globalChannel) {
    if (globalChannel.state === 'joined' || globalChannel.state === 'joining') {
      return globalChannel;
    }
  }

  // Check if supabase already has this channel in internal registry
  const existing = supabase.getChannels().find(c => c.topic === 'realtime:app_realtime_global');
  if (existing) {
    if (existing.state === 'joined' || existing.state === 'joining') {
      globalChannel = existing;
      return globalChannel;
    }
    // Clean up stale or errored channel instance to re-establish a fresh connection
    supabase.removeChannel(existing);
  }

  const invalidate = (queryKey: any[]) => {
    if (activeQueryClient) {
      activeQueryClient.invalidateQueries({ queryKey });
    }
  };

  globalChannel = supabase
    .channel('app_realtime_global')
    // 1. Duty logs
    .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_logs' }, () => {
      invalidate(dutyKeys.all);
      invalidate(['queue_users']);
      invalidate(['salary']);
    })
    // 2. Users profile & position updates
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
      invalidate(['users']);
      invalidate(['queue_users']);
      invalidate(['salary']);

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
      invalidate(['positions']);
      invalidate(['salary']);
    })
    // 4. System Settings (e.g. Volunteers)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
      invalidate(['system_settings']);
      invalidate(['queue_users']);
    })
    // 5. Queue Status (Doctor queue positions)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_status' }, () => {
      invalidate(['queue_users']);
    })
    // 6. Story Logs
    .on('postgres_changes', { event: '*', schema: 'public', table: 'story_logs' }, () => {
      invalidate(['queue_users']);
      invalidate(['salary']);
    })
    // 7. Queue Manager Logs
    .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_manager_logs' }, () => {
      invalidate(['queue_users']);
      invalidate(['salary']);
    })
    // 8. Leave Requests
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
      invalidate(['leaves']);
      invalidate(['salary']);
    })
    // 9. Accounting & Inventory logs
    .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_logs' }, () => {
      invalidate(['accounting', 'finance']);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
      invalidate(['accounting', 'inventory']);
    })
    // 10. Notifications
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
      invalidate(['notifications']);
    })
    // 11. Admin broadcast reload
    .on('broadcast', { event: 'force_reload' }, () => {
      window.location.reload();
    })
    .subscribe((status, err) => {
      const isSubscribed = status === 'SUBSCRIBED';
      useRealtimeStore.getState().setIsConnected(isSubscribed);
      if (err) {
        console.warn('[Realtime] subscription error:', err);
      }
    });

  return globalChannel;
}

/**
 * Enterprise Consolidated Realtime Manager
 * Runs a single persistent multiplexed channel across the application session.
 */
export function useAppRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    initGlobalRealtimeChannel(queryClient);

    // Watchdog for expired breaks every 60s
    const breakSweepInterval = setInterval(() => {
      cleanupAllExpiredBreaks().then((count) => {
        if (count > 0 && activeQueryClient) {
          activeQueryClient.invalidateQueries({ queryKey: dutyKeys.all });
          activeQueryClient.invalidateQueries({ queryKey: ['queue_users'] });
        }
      });
    }, 60000);

    // Reconnection watchdog on window focus or network recovery
    const handleRecheck = () => {
      if (!globalChannel || (globalChannel.state !== 'joined' && globalChannel.state !== 'joining')) {
        initGlobalRealtimeChannel(queryClient);
      }
      queryClient.invalidateQueries({ queryKey: dutyKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    window.addEventListener('online', handleRecheck);
    window.addEventListener('focus', handleRecheck);

    return () => {
      clearInterval(breakSweepInterval);
      window.removeEventListener('online', handleRecheck);
      window.removeEventListener('focus', handleRecheck);
      // NOTE: We intentionally DO NOT unsubscribe or remove the channel here!
      // The single global channel persists across the application lifetime,
      // preventing socket disconnection/reconnection churn and ensuring uninterrupted realtime.
    };
  }, [queryClient]);
}
