import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LayoutGrid, 
  Clock, 
  CalendarDays, 
  Users, 
  Banknote, 
  Settings, 
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { isAdmin } from '../utils/permissions';
import { showConfirmDialog } from '@/utils/alert';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    const result = await showConfirmDialog({
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      icon: 'question',
      confirmButtonText: 'ออกจากระบบ',
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) {
      await supabase.auth.signOut();
      logout();
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `no-underline flex items-center gap-2.5 px-3 py-2 mx-2.5 my-0.5 rounded-lg text-xs transition-colors ${
      isActive 
        ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200/80 shadow-2xs' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
    } ${isCollapsed ? 'justify-center px-0 mx-2' : ''}`;

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-200 ease-in-out print:hidden select-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-[68px]' : 'w-[230px]'}
      `}>
        
        {/* Sleek Minimal Brand Logo Header (h-[60px] to match Main Header) */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-4'} shrink-0 h-[60px] border-b border-slate-100 overflow-hidden`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className="w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden rounded-lg bg-purple-50/50"
              style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px', overflow: 'hidden' }}
            >
              <img 
                src="/logo.png" 
                alt="Logo" 
                width="28"
                height="28"
                className="w-7 h-7 object-contain shrink-0" 
                style={{ width: '28px', height: '28px', maxWidth: '28px', maxHeight: '28px', objectFit: 'contain' }}
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-slate-900">MEDIC</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1 py-0.2 rounded border border-purple-200/60 font-mono">V2</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider truncate">WIP TOWN</span>
              </div>
            )}
          </div>
        </div>
      
        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-2.5 flex flex-col scrollbar-hide">
          <NavLink to="/dashboard" className={navLinkClass} onClick={handleNavClick} title="กระดานหลัก">
            <LayoutDashboard size={17} className={isCollapsed ? '' : 'shrink-0 text-slate-500'} />
            {!isCollapsed && <span className="truncate">กระดานหลัก</span>}
          </NavLink>
          
          {/* Section Divider & Label */}
          {!isCollapsed ? (
            <div className="px-4 text-[10px] font-bold text-slate-400 mt-4 mb-1 tracking-wider uppercase">
              บริการแพทย์
            </div>
          ) : (
            <div className="h-px bg-slate-100 my-2 mx-3" />
          )}
          
          <NavLink to="/queue" className={navLinkClass} onClick={handleNavClick} title="ระบบรับคิวแพทย์">
            <LayoutGrid size={17} className={isCollapsed ? '' : 'shrink-0 text-slate-500'} />
            {!isCollapsed && <span className="truncate">ระบบรับคิวแพทย์</span>}
          </NavLink>

          <NavLink to="/duty" className={navLinkClass} onClick={handleNavClick} title="ระบบเข้าเวรออกเวร">
            <Clock size={17} className={isCollapsed ? '' : 'shrink-0 text-slate-500'} />
            {!isCollapsed && <span className="truncate">ระบบเข้าเวรออกเวร</span>}
          </NavLink>

          <NavLink to="/leave" className={navLinkClass} onClick={handleNavClick} title="ระบบลางาน">
            <CalendarDays size={17} className={isCollapsed ? '' : 'shrink-0 text-slate-500'} />
            {!isCollapsed && <span className="truncate">ระบบลางาน</span>}
          </NavLink>
          
          {isAdmin(user?.role) && (
            <>
              {!isCollapsed ? (
                <div className="px-4 text-[10px] font-bold text-slate-400 mt-4 mb-1 tracking-wider uppercase">
                  ระบบผู้บริหาร
                </div>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-3" />
              )}
              
              <NavLink to="/personnel" className={navLinkClass} onClick={handleNavClick} title="ระบบจัดการบุคลากร">
                <Users size={17} className={isCollapsed ? '' : 'shrink-0 text-slate-500'} />
                {!isCollapsed && <span className="truncate">จัดการบุคลากร</span>}
              </NavLink>

              <NavLink to="/salary" className={navLinkClass} onClick={handleNavClick} title="ระบบคำนวณเงินเดือน">
                <Banknote size={17} className={isCollapsed ? '' : 'shrink-0 text-slate-500'} />
                {!isCollapsed && <span className="truncate">คำนวณเงินเดือน</span>}
              </NavLink>
            </>
          )}
          
          {/* Bottom Actions */}
          <div className="mt-auto pt-3 border-t border-slate-100 shrink-0">
            {isAdmin(user?.role) && (
              <NavLink to="/settings" className={navLinkClass} onClick={handleNavClick} title="ตั้งค่าระบบ">
                <Settings size={17} className={isCollapsed ? '' : 'shrink-0 text-slate-500'} />
                {!isCollapsed && <span className="truncate">ตั้งค่าระบบ</span>}
              </NavLink>
            )}

            <button 
              className={`w-full flex items-center gap-2.5 px-3 py-2 mx-2.5 my-0.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer border-none bg-transparent ${
                isCollapsed ? 'justify-center px-0 mx-2 !w-[calc(100%-1rem)]' : '!w-[calc(100%-1.25rem)]'
              }`}
              onClick={handleLogout} 
              title="ออกจากระบบ"
            >
              <LogOut size={17} className={isCollapsed ? '' : 'shrink-0'} />
              {!isCollapsed && <span className="truncate">ออกจากระบบ</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
