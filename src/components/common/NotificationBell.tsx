import { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none shrink-0 border-none bg-transparent cursor-pointer !min-h-0"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">การแจ้งเตือน</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors border-none bg-transparent cursor-pointer !min-h-0"
                >
                  อ่านทั้งหมด
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={() => deleteAllNotifications()}
                  className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors border-none bg-transparent cursor-pointer !min-h-0 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  ล้างทั้งหมด
                </button>
              )}
            </div>
          </div>

          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 mb-3 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-medium">ไม่มีการแจ้งเตือนใหม่</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  
                  <div 
                    key={n.id} 
                    className={'group p-4 hover:bg-slate-50 transition-colors relative flex gap-3 ' + (!n.is_read ? 'bg-indigo-50/30' : '')}
                  >
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(n)}>
                      <div className="flex justify-between items-start mb-1 pr-6">
                        <p className={'text-sm font-semibold truncate ' + (!n.is_read ? 'text-indigo-900' : 'text-slate-700')}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 ml-2"></span>}
                      </div>
                      <p className={'text-sm line-clamp-2 pr-6 ' + (!n.is_read ? 'text-indigo-700/80' : 'text-slate-500')}>
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: th })}
                      </p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="absolute right-4 top-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all border-none bg-transparent cursor-pointer !min-h-0"
                      title="ลบแจ้งเตือน"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
