import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LayoutGrid, 
  Clock, 
  CalendarDays, 
  Users, 
  UserCog, 
  Banknote, 
  Wallet, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
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

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        logout();
      }
    });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `nav-item ${isActive ? 'active' : ''}`;

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${isCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        
        {/* Logo */}
        <div className="sidebar-logo">
          {!isCollapsed && (
            <>
              <img src="/logo.png" alt="Logo" />
              <h2>MEDIC<br/>WIPTOWN</h2>
            </>
          )}
          {isCollapsed && (
            <img src="/logo.png" alt="Logo" style={{ margin: '0 auto' }} />
          )}
        </div>
      
        <nav className="sidebar-nav">
          <NavLink to="/" className={navLinkClass} end onClick={handleNavClick} title="กระดานหลัก">
            <LayoutDashboard size={20} />
            {!isCollapsed && <span>กระดานหลัก</span>}
          </NavLink>
          
          <div className="nav-divider" style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)', opacity: 0.5 }}></div>
          {!isCollapsed && (
            <div style={{ padding: '0 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>MEDIC SERVICES</div>
          )}
          
          <NavLink to="/queue" className={navLinkClass} onClick={handleNavClick} title="ระบบรันคิวแพทย์">
            <LayoutGrid size={20} />
            {!isCollapsed && <span>ระบบรันคิวแพทย์</span>}
          </NavLink>
          <NavLink to="/duty" className={navLinkClass} onClick={handleNavClick} title="ระบบเข้าเวรออกเวร">
            <Clock size={20} />
            {!isCollapsed && <span>ระบบเข้าเวรออกเวร</span>}
          </NavLink>
          <NavLink to="/leave" className={navLinkClass} onClick={handleNavClick} title="ระบบลางาน">
            <CalendarDays size={20} />
            {!isCollapsed && <span>ระบบลางาน</span>}
          </NavLink>
          <NavLink to="/requests" className={navLinkClass} onClick={handleNavClick} title="ระบบจัดการคำร้อง">
            <UserCog size={20} />
            {!isCollapsed && <span>ระบบจัดการคำร้อง</span>}
          </NavLink>

          {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'management') && (
            <>
              <div className="nav-divider" style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)', opacity: 0.5 }}></div>
              {!isCollapsed && (
                <div style={{ padding: '0 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>ADMIN ONLY</div>
              )}
              
              <NavLink to="/personnel" className={navLinkClass} onClick={handleNavClick} title="ระบบจัดการบุคลากรแพทย์">
                <Users size={20} />
                {!isCollapsed && <span>ระบบจัดการบุคลากรแพทย์</span>}
              </NavLink>
              <NavLink to="/salary" className={navLinkClass} onClick={handleNavClick} title="ระบบคำนวณเงินเดือน">
                <Banknote size={20} />
                {!isCollapsed && <span>ระบบคำนวณเงินเดือน</span>}
              </NavLink>
              <NavLink to="/accounting" className={navLinkClass} onClick={handleNavClick} title="ระบบบัญชี & คลังสิ่งของ">
                <Wallet size={20} />
                {!isCollapsed && <span>ระบบบัญชี &amp; คลังสิ่งของ</span>}
              </NavLink>
            </>
          )}
          
          <div style={{ marginTop: 'auto' }}>
            {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'management') && (
              <NavLink to="/settings" className={navLinkClass} onClick={handleNavClick} title="ตั้งค่าระบบ & รายงาน">
                <Settings size={20} />
                {!isCollapsed && <span>ตั้งค่าระบบ &amp; รายงาน</span>}
              </NavLink>
            )}
            <div className="nav-item" onClick={handleLogout} style={{ color: '#ef4444', marginTop: '0.5rem', cursor: 'pointer' }} title="ออกจากระบบ">
              <LogOut size={20} />
              {!isCollapsed && <span>ออกจากระบบ</span>}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
