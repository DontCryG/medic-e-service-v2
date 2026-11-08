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
  const channel = supabase.getChannels().find(c => c.topic === 'realtime:rt_broadcast');
  if (channel && channel.state === 'joined') {
    channel.send({ type: 'broadcast', event: 'force_sync', payload: {} });
  }
};

export const broadcastForceReload = () => {
  const channel = supabase.getChannels().find(c => c.topic === 'realtime:rt_broadcast');
  if (channel && channel.state === 'joined') {
    channel.send({ type: 'broadcast', event: 'force_reload', payload: { by: 'admin', at: new Date().toISOString() } });
  }
};

// Singleton channel references & active query client
type RealtimeChannel = ReturnType<typeof supabase.channel>;
let dutyQueueChannel: RealtimeChannel | null = null;
let usersAuthChannel: RealtimeChannel | null = null;
let operationsChannel: RealtimeChannel | null = null;
let broadcastChannel: RealtimeChannel | null = null;
let activeQueryClient: QueryClient | null = null;

export function initGlobalRealtimeChannels(queryClient: QueryClient) {
  activeQueryClient = queryClient;

  const invalidate = (queryKey: any[]) => {
    if (activeQueryClient) {
      activeQueryClient.invalidateQueries({ queryKey });
    }
  };

  // 1. Duty & Queue Channel (max 5 tables)
  const existingDQ = supabase.getChannels().find(c => c.topic === 'realtime:rt_duty_queue');
  if (!dutyQueueChannel || (dutyQueueChannel.state !== 'joined' && dutyQueueChannel.state !== 'joining')) {
    if (existingDQ) {
      if (existingDQ.state === 'joined' || existingDQ.state === 'joining') {
        dutyQueueChannel = existingDQ;
      } else {
        supabase.removeChannel(existingDQ);
      }
    }
    if (!dutyQueueChannel || dutyQueueChannel.state === 'closed') {
      dutyQueueChannel = supabase
        .channel('rt_duty_queue')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'duty_logs' }, () => {
          invalidate(dutyKeys.all);
          invalidate(['queue_users']);
          invalidate(['salary']);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_status' }, () => {
          invalidate(['queue_users']);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'story_logs' }, () => {
          invalidate(['queue_users']);
          invalidate(['salary']);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_manager_logs' }, () => {
          invalidate(['queue_users']);
          invalidate(['salary']);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
          invalidate(['system_settings']);
          invalidate(['queue_users']);
        })
        .subscribe((status, err) => {
          const isSubscribed = status === 'SUBSCRIBED';
          useRealtimeStore.getState().setIsConnected(isSubscribed);
          if (err) console.warn('[Realtime] duty_queue error:', err);
        });
    }
  }

  // 2. Users & Positions & Notifications Channel (3 tables)
  const existingUA = supabase.getChannels().find(c => c.topic === 'realtime:rt_users_auth');
  if (!usersAuthChannel || (usersAuthChannel.state !== 'joined' && usersAuthChannel.state !== 'joining')) {
    if (existingUA) {
      if (existingUA.state === 'joined' || existingUA.state === 'joining') {
        usersAuthChannel = existingUA;
      } else {
        supabase.removeChannel(existingUA);
      }
    }
    if (!usersAuthChannel || usersAuthChannel.state === 'closed') {
      usersAuthChannel = supabase
        .channel('rt_users_auth')
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => {
          invalidate(['positions']);
          invalidate(['salary']);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
          invalidate(['notifications']);
        })
        .subscribe();
    }
  }

  // 3. Operations Channel (Leave & Accounting, 3 tables)
  const existingOp = supabase.getChannels().find(c => c.topic === 'realtime:rt_operations');
  if (!operationsChannel || (operationsChannel.state !== 'joined' && operationsChannel.state !== 'joining')) {
    if (existingOp) {
      if (existingOp.state === 'joined' || existingOp.state === 'joining') {
        operationsChannel = existingOp;
      } else {
        supabase.removeChannel(existingOp);
      }
    }
    if (!operationsChannel || operationsChannel.state === 'closed') {
      operationsChannel = supabase
        .channel('rt_operations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => {
          invalidate(['leaves']);
          invalidate(['salary']);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'accounting_logs' }, () => {
          invalidate(['accounting', 'finance']);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
          invalidate(['accounting', 'inventory']);
        })
        .subscribe();
    }
  }

  // 4. Broadcast Channel
  const existingBC = supabase.getChannels().find(c => c.topic === 'realtime:rt_broadcast');
  if (!broadcastChannel || (broadcastChannel.state !== 'joined' && broadcastChannel.state !== 'joining')) {
    if (existingBC) {
      if (existingBC.state === 'joined' || existingBC.state === 'joining') {
        broadcastChannel = existingBC;
      } else {
        supabase.removeChannel(existingBC);
      }
    }
    if (!broadcastChannel || broadcastChannel.state === 'closed') {
      broadcastChannel = supabase
        .channel('rt_broadcast')
        .on('broadcast', { event: 'force_reload' }, () => {
          window.location.reload();
        })
        .subscribe();
    }
  }
}

/**
 * Enterprise Consolidated Realtime Manager
 * Runs persistent multiplexed domain-scoped channels across the application session.
 */
export function useAppRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    initGlobalRealtimeChannels(queryClient);

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
      initGlobalRealtimeChannels(queryClient);
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
    };
  }, [queryClient]);
}
