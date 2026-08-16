import { useState, useRef, useEffect } from 'react';
import { Search, LayoutGrid, Clock, CalendarDays, Users, UserCog, Banknote, Wallet, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

const searchIndex = [
  { path: '/dashboard', title: 'หน้าแรก (Dashboard)', icon: <LayoutGrid size={16} />, keywords: ['หน้าแรก', 'home', 'แดชบอร์ด', 'dashboard', 'เมนู'], requireAdmin: false },
  { path: '/queue', title: 'ระบบรับคิวแพทย์', icon: <LayoutGrid size={16} />, keywords: ['คิว', 'queue', 'ผู้ป่วย', 'รอ', 'ตรวจ'], requireAdmin: false },
  { path: '/duty', title: 'ระบบเข้าเวรออกเวร', icon: <Clock size={16} />, keywords: ['เวร', 'duty', 'เข้างาน', 'ออกงาน', 'เวลา'], requireAdmin: false },
  { path: '/leave', title: 'ระบบลางาน', icon: <CalendarDays size={16} />, keywords: ['ลา', 'leave', 'พักผ่อน', 'ลาป่วย', 'ขอลางาน'], requireAdmin: false },
  { path: '/requests', title: 'ระบบจัดการคำร้อง', icon: <UserCog size={16} />, keywords: ['คำร้อง', 'request', 'อนุมัติ', 'จัดการ'], requireAdmin: false },
  { path: '/personnel', title: 'ระบบจัดการบุคลากรแพทย์', icon: <Users size={16} />, keywords: ['บุคลากร', 'personnel', 'คน', 'พนักงาน', 'สมาชิก'], requireAdmin: true },
  { path: '/salary', title: 'ระบบคำนวณเงินเดือน', icon: <Banknote size={16} />, keywords: ['เงินเดือน', 'salary', 'เงิน', 'รายได้', 'จ่าย'], requireAdmin: true },
  { path: '/accounting', title: 'ระบบบัญชี & คลังสิ่งของ', icon: <Wallet size={16} />, keywords: ['บัญชี', 'accounting', 'คลัง', 'สิ่งของ', 'เบิก', 'ของ', 'รายรับ', 'รายจ่าย'], requireAdmin: true },
  { path: '/settings', title: 'ตั้งค่าระบบ', icon: <Settings size={16} />, keywords: ['ตั้งค่า', 'settings', 'ระบบ', 'config'], requireAdmin: true },
];

export default function Header({ setIsMobileMenuOpen }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : 'M';
  const isAdmin = user?.role === 'director' || user?.role === 'deputy_director' || user?.role === 'admin' || user?.role === 'management';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter results based on query and roles
  const filteredResults = searchIndex.filter(item => {
    if (item.requireAdmin && !isAdmin) return false;
    if (!query) return false;
    
    const lowerQuery = query.toLowerCase();
    const matchTitle = item.title.toLowerCase().includes(lowerQuery);
    const matchKeyword = item.keywords.some(k => k.toLowerCase().includes(lowerQuery));
    
    return matchTitle || matchKeyword;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex].path);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <header className="dashboard-header">
      <div className="header-left-actions">
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        
        {/* Search Bar Container */}
        <div style={{ position: 'relative' }} ref={searchRef}>
          <div className="header-search">
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="ค้นหาเมนูการใช้งาน..." 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {isOpen && query.length > 0 && (
              <motion.div 
                className="search-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: '120%',
                  left: 0,
                  width: '100%',
                  minWidth: '300px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  zIndex: 100
                }}
              >
                {filteredResults.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: '0.5rem', margin: 0 }}>
                    {filteredResults.map((result, idx) => (
                      <li key={result.path}>
                        <button
                          onClick={() => handleSelect(result.path)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 16px',
                            background: idx === selectedIndex ? 'var(--bg-secondary)' : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: idx === selectedIndex ? 'var(--primary)' : 'var(--text-primary)',
                            transition: 'all 0.1s'
                          }}
                        >
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: idx === selectedIndex ? 'var(--primary)' : 'var(--text-secondary)'
                          }}>
                            {result.icon}
                          </span>
                          <span style={{ fontWeight: idx === selectedIndex ? 500 : 400 }}>
                            {result.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    ไม่พบเมนูที่ตรงกับการค้นหา 😥
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="header-actions">
        <div className="user-profile">
          <div className="user-info">
            <div className="user-name">{user?.ic_name || 'Guest'}</div>
            <div className="user-role">{user?.position?.name || 'Loading...'}</div>
          </div>
          <div className="user-avatar" style={{ padding: user?.avatar_url ? 0 : undefined, overflow: 'hidden' }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitial(user?.ic_name)
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
