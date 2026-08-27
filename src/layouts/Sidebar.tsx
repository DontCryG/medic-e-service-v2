import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LayoutGrid, 
  Clock, 
  CalendarDays, 
  Users, 
  Banknote, 
  Wallet, 
  Settings, 
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        logout();
      }
    });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `no-underline flex items-center gap-3 px-4 py-3.5 mx-3 my-1 rounded-2xl font-medium transition-all duration-300 ${
      isActive 
        ? 'bg-[#7e22ce]/10 text-[#7e22ce] font-semibold' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-[#7e22ce] hover:translate-x-1'
    } ${isCollapsed ? 'justify-center px-0 mx-2' : ''}`;

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-[84px]' : 'w-[260px]'}
      `}>
        
        {/* Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-6'} py-6 shrink-0 h-[80px]`}>
          <img src="/logo.png" alt="Logo" className={`${isCollapsed ? 'w-10 h-10' : 'w-11 h-11'} object-contain drop-shadow-sm`} />
          {!isCollapsed && (
            <h2 className="text-[1.1rem] font-black leading-tight text-slate-800 tracking-tight">
              MEDIC<br/><span className="text-[#7e22ce]">WIPTOWN</span>
            </h2>
          )}
        </div>
      
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 flex flex-col scrollbar-hide">
          <NavLink to="/dashboard" className={navLinkClass} onClick={handleNavClick}>
            <LayoutDashboard size={20} className={isCollapsed ? '' : 'shrink-0'} />
            {!isCollapsed && <span className="truncate">กระดานหลัก</span>}
          </NavLink>
          
          <div className="h-px bg-slate-100 my-4 mx-6"></div>
          {!isCollapsed && (
            <div className="px-6 text-[0.7rem] font-bold text-slate-400 mb-2 tracking-wider">MEDIC SERVICES</div>
          )}
          
          <NavLink to="/queue" className={navLinkClass} onClick={handleNavClick}>
            <LayoutGrid size={20} className={isCollapsed ? '' : 'shrink-0'} />
            {!isCollapsed && <span className="truncate">ระบบรับคิวแพทย์</span>}
          </NavLink>
          <NavLink to="/duty" className={navLinkClass} onClick={handleNavClick}>
            <Clock size={20} className={isCollapsed ? '' : 'shrink-0'} />
            {!isCollapsed && <span className="truncate">ระบบเข้าเวรออกเวร</span>}
          </NavLink>
          <NavLink to="/leave" className={navLinkClass} onClick={handleNavClick}>
            <CalendarDays size={20} className={isCollapsed ? '' : 'shrink-0'} />
            {!isCollapsed && <span className="truncate">ระบบลางาน</span>}
          </NavLink>
          
          {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'management') && (
            <>
              <div className="h-px bg-slate-100 my-4 mx-6"></div>
              {!isCollapsed && (
                <div className="px-6 text-[0.7rem] font-bold text-slate-400 mb-2 tracking-wider">ADMIN ONLY</div>
              )}
              
              <NavLink to="/personnel" className={navLinkClass} onClick={handleNavClick}>
                <Users size={20} className={isCollapsed ? '' : 'shrink-0'} />
                {!isCollapsed && <span className="truncate">ระบบจัดการบุคลากร</span>}
              </NavLink>
              <NavLink to="/salary" className={navLinkClass} onClick={handleNavClick}>
                <Banknote size={20} className={isCollapsed ? '' : 'shrink-0'} />
                {!isCollapsed && <span className="truncate">ระบบคำนวณเงินเดือน</span>}
              </NavLink>
              <NavLink to="/accounting" className={navLinkClass} onClick={handleNavClick}>
                <Wallet size={20} className={isCollapsed ? '' : 'shrink-0'} />
                {!isCollapsed && <span className="truncate">ระบบบัญชี & คลังสิ่งของ</span>}
              </NavLink>
            </>
          )}
          
          <div className="mt-auto pt-4 shrink-0">
            {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'management') && (
              <NavLink to="/settings" className={navLinkClass} onClick={handleNavClick}>
                <Settings size={20} className={isCollapsed ? '' : 'shrink-0'} />
                {!isCollapsed && <span className="truncate">ตั้งค่าระบบ</span>}
              </NavLink>
            )}
            <button 
              className={`w-full flex items-center gap-3 px-4 py-3 mx-3 my-1 rounded-2xl font-semibold transition-all duration-300 text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:translate-x-1 cursor-pointer border-none bg-transparent ${isCollapsed ? 'justify-center px-0 mx-2 !w-[calc(100%-1rem)] hover:translate-x-0' : '!w-[calc(100%-1.5rem)]'}`}
              onClick={handleLogout} 
              title="ออกจากระบบ"
            >
              <LogOut size={20} className={isCollapsed ? '' : 'shrink-0'} />
              {!isCollapsed && <span className="truncate">ออกจากระบบ</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
