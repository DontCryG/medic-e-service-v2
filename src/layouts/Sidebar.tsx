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
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
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

  return (
    <>
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Logo" />
        <h2>MEDIC<br/>WIPTOWN</h2>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={navLinkClass} end onClick={() => setIsMobileMenuOpen(false)}>
          <LayoutDashboard size={20} />
          <span>กระดานหลัก</span>
        </NavLink>
        
        <div className="nav-divider" style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)', opacity: 0.5 }}></div>
        <div style={{ padding: '0 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>MEDIC SERVICES</div>
        
        <NavLink to="/queue" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
          <LayoutGrid size={20} />
          <span>ระบบรันคิวแพทย์</span>
        </NavLink>
        <NavLink to="/duty" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
          <Clock size={20} />
          <span>ระบบเข้าเวรออกเวร</span>
        </NavLink>
        <NavLink to="/leave" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
          <CalendarDays size={20} />
          <span>ระบบลางาน</span>
        </NavLink>
        <NavLink to="/requests" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
          <UserCog size={20} />
          <span>ระบบจัดการคำร้อง</span>
        </NavLink>

        {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'management') && (
          <>
            <div className="nav-divider" style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)', opacity: 0.5 }}></div>
            <div style={{ padding: '0 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>ADMIN ONLY</div>
            
            <NavLink to="/personnel" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              <Users size={20} />
              <span>ระบบจัดการบุคลากรแพทย์</span>
            </NavLink>
            <NavLink to="/salary" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              <Banknote size={20} />
              <span>ระบบคำนวณเงินเดือน</span>
            </NavLink>
            <NavLink to="/accounting" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              <Wallet size={20} />
              <span>ระบบบัญชี & คลังสิ่งของ</span>
            </NavLink>
          </>
        )}
        
        <div style={{ marginTop: 'auto' }}>
          {(user?.role === 'admin' || user?.role === 'director' || user?.role === 'management') && (
            <NavLink to="/settings" className={navLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
              <Settings size={20} />
              <span>ตั้งค่าระบบ & รายงาน</span>
            </NavLink>
          )}
          <div className="nav-item" onClick={handleLogout} style={{ color: '#ef4444', marginTop: '0.5rem', cursor: 'pointer' }}>
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </div>
        </div>
      </nav>
    </aside>
    </>
  );
}
