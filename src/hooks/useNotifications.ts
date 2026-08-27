import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

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
  const isAdmin = user?.role === 'admin' || user?.role === 'director' || user?.role === 'co-director';
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .in('discord_id', isAdmin ? [user.discord_id, 'ALL_ADMINS'] : [user.discord_id])
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (data) {
      setNotifications(data as AppNotification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase.channel('public:notifications:' + user.discord_id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'discord_id=eq.' + user.discord_id }, () => fetchNotifications());
      
    if (isAdmin) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'discord_id=eq.ALL_ADMINS' }, () => fetchNotifications());
    }
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).in('discord_id', isAdmin ? [user.discord_id, 'ALL_ADMINS'] : [user.discord_id]).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
