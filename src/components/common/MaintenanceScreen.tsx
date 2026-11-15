import React from 'react';
import { Wrench, Clock, LogOut, RefreshCw, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type { MaintenanceConfig } from '@/hooks/useMaintenanceMode';

interface MaintenanceScreenProps {
  maintenance: MaintenanceConfig;
  onRetry?: () => void;
}

export default function MaintenanceScreen({ maintenance, onRetry }: MaintenanceScreenProps) {
  const { user, logout } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  const handleCheckStatus = () => {
    setIsRefreshing(true);
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleDiscordAdminLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo: window.location.origin }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#fafafa] text-slate-800 antialiased select-none font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 sm:p-8 flex flex-col items-center text-center animate-in zoom-in-98 duration-200">
        
        {/* Pulsing Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Under Maintenance</span>
        </div>

        {/* Icon & Brand Box */}
        <div 
          className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-center text-amber-600 mb-5 shadow-xs"
          style={{ width: '64px', height: '64px' }}
        >
          <Wrench size={30} className="animate-bounce" />
        </div>

        {/* Title & Message */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0 mb-2">
          {maintenance.title || 'ระบบกำลังอยู่ระหว่างการพัฒนาและปรับปรุง'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm m-0 mb-6 font-medium">
          {maintenance.message || 'หน่วยงานแพทย์กำลังดำเนินการอัปเดตระบบ เพื่อเพิ่มประสิทธิภาพและความปลอดภัย กรุณากลับมาใช้งานใหม่อีกครั้งในภายหลัง'}
        </p>

        {/* Estimated Completion Time (if set) */}
        {maintenance.estimated_end && (
          <div className="w-full mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center gap-2 text-xs text-slate-600">
            <Clock size={15} className="text-purple-600 shrink-0" />
            <span>คาดว่าจะแล้วเสร็จประมาณ: <strong>{maintenance.estimated_end}</strong></span>
          </div>
        )}

        {/* Admin Bypass Info Box */}
        <div className="w-full p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/60 text-left flex items-start gap-2.5 text-xs text-purple-900 mb-6">
          <ShieldAlert size={16} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold block text-purple-800">สำหรับผู้ดูแลระบบ (Admin Access)</span>
            ผู้ดูแลระบบสามารถเข้าสู่ระบบเพื่อทดสอบ ปรับแต่ง หรือปลดล็อคโหมดปรับปรุงได้ตามปกติ
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleCheckStatus}
            disabled={isRefreshing}
            className="w-full h-10 rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer border-none disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะระบบอีกครั้ง'}</span>
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="w-full h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>ออกจากระบบ (Logout)</span>
            </button>
          ) : (
            <button
              onClick={handleDiscordAdminLogin}
              className="w-full h-9 rounded-lg bg-white border border-purple-200 hover:bg-purple-50/50 text-purple-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>เข้าสู่ระบบสำหรับผู้ดูแล (Admin Login)</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>WIP TOWN • Medic Division</span>
          <span>Version 2.0</span>
        </div>

      </div>
    </div>
  );
}
