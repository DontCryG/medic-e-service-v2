import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playNotificationSound } from '@/utils/sound';

export interface AppNotification {
  id: string;
  created_at: string;
  discord_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
}

export function useNotifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin' || user?.role === 'director' || user?.role === 'co-director' || user?.role === 'management';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.discord_id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('discord_id', isAdmin ? [user!.discord_id, 'ALL_ADMINS'] : [user!.discord_id])
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      return data as AppNotification[];
    },
    refetchInterval: 10000 // Fallback polling every 10 seconds in case realtime is off
  });


  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Track latest notification to trigger sound
  const [latestNotifId, setLatestNotifId] = useState<string | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const topId = notifications[0].id;
      if (latestNotifId !== null && topId !== latestNotifId) {
        // If the top notification ID changed, it means a new one arrived!
        // Only play if it's unread
        if (!notifications[0].is_read) {
          playNotificationSound();
        }
      }
      setLatestNotifId(topId);
    }
  }, [notifications, latestNotifId]);


  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('public:notifications:' + user.discord_id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const { mutate: markAsRead } = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.discord_id] });
      const previous = queryClient.getQueryData<AppNotification[]>(['notifications', user?.discord_id]);
      if (previous) {
        queryClient.setQueryData<AppNotification[]>(['notifications', user?.discord_id], 
          previous.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
      }
      return { previous };
    },
    onError: (err, newTodo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', user?.discord_id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.discord_id] });
    }
  });
  
  
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => {
      await supabase.from('notifications').update({ is_read: true })
        .in('discord_id', isAdmin ? [user!.discord_id, 'ALL_ADMINS'] : [user!.discord_id])
        .eq('is_read', false);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.discord_id] });
      const previous = queryClient.getQueryData<AppNotification[]>(['notifications', user?.discord_id]);
      if (previous) {
        queryClient.setQueryData<AppNotification[]>(['notifications', user?.discord_id], 
          previous.map(n => ({ ...n, is_read: true }))
        );
      }
      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.discord_id] });
    }
  });

  const { mutate: deleteNotification } = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').delete().eq('id', id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.discord_id] });
      const previous = queryClient.getQueryData<AppNotification[]>(['notifications', user?.discord_id]);
      if (previous) {
        queryClient.setQueryData<AppNotification[]>(['notifications', user?.discord_id], 
          previous.filter(n => n.id !== id)
        );
      }
      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.discord_id] });
    }
  });
  
  const { mutate: deleteAllNotifications } = useMutation({
    mutationFn: async () => {
      await supabase.from('notifications').delete()
        .in('discord_id', isAdmin ? [user!.discord_id, 'ALL_ADMINS'] : [user!.discord_id]);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.discord_id] });
      const previous = queryClient.getQueryData<AppNotification[]>(['notifications', user?.discord_id]);
      if (previous) {
        queryClient.setQueryData<AppNotification[]>(['notifications', user?.discord_id], []);
      }
      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.discord_id] });
    }
  });


  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications
  };
}
