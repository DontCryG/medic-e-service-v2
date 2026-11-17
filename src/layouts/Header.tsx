import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isAdmin as checkIsAdmin } from '@/utils/permissions';
import { getInitial } from '../pages/PersonnelSystem/utils/personnelUtils';
import { 
  Search, 
  Menu, 
  PanelLeftClose, 
  PanelLeftOpen, 
  LayoutDashboard, 
  LayoutGrid, 
  Clock, 
  CalendarDays, 
  Users, 
  Banknote, 
  Settings
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationBell from '@/components/common/NotificationBell';
import UserProfileModal from '@/components/common/UserProfileModal';

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export default function Header({ setIsMobileMenuOpen, isSidebarCollapsed, setIsSidebarCollapsed }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = checkIsAdmin(user?.role);

  const searchIndex = [
    { title: 'กระดานหลัก (Dashboard)', path: '/dashboard', icon: <LayoutDashboard size={16}/>, keywords: ['หน้าแรก', 'home', 'dashboard'], requireAdmin: false },
    { title: 'ระบบรับคิวแพทย์ (Queue)', path: '/queue', icon: <LayoutGrid size={16}/>, keywords: ['คิว', 'queue', 'ผู้ป่วย'], requireAdmin: false },
    { title: 'ระบบเข้าเวรออกเวร (Duty)', path: '/duty', icon: <Clock size={16}/>, keywords: ['เวร', 'เข้าเวร', 'ออกเวร', 'duty'], requireAdmin: false },
    { title: 'ระบบลางาน (Leave)', path: '/leave', icon: <CalendarDays size={16}/>, keywords: ['ลา', 'ลางาน', 'พักร้อน', 'leave'], requireAdmin: false },
    { title: 'ระบบจัดการบุคลากร (Personnel)', path: '/personnel', icon: <Users size={16}/>, keywords: ['หมอ', 'บุคลากร', 'แพทย์', 'personnel'], requireAdmin: true },
    { title: 'ระบบคำนวณเงินเดือน (Salary)', path: '/salary', icon: <Banknote size={16}/>, keywords: ['เงินเดือน', 'ค่ารอบ', 'salary'], requireAdmin: true },
    { title: 'ตั้งค่าระบบ (Settings)', path: '/settings', icon: <Settings size={16}/>, keywords: ['ตั้งค่า', 'settings', 'config'], requireAdmin: true },
  ];

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredResults = searchIndex.filter(item => {
    if (item.requireAdmin && !isAdmin) return false;
    if (!query) return false;
    const lowerQuery = query.toLowerCase();
    return item.title.toLowerCase().includes(lowerQuery) || item.keywords.some(k => k.toLowerCase().includes(lowerQuery));
  });

  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, []);

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
      inputRef.current?.blur();
    }
  };

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  return (
    <header className="w-full h-[60px] bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 sticky top-0">
      
      {/* Left: Mobile Toggle & Sidebar Toggle & Clean Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <button 
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer shrink-0"
          onClick={() => setIsMobileMenuOpen(true)}
          title="เปิดเมนู"
        >
          <Menu size={18} />
        </button>

        <button
          className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer shrink-0"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        
        {/* Minimal Command Bar Search */}
        <div className="relative w-full max-w-[340px] hidden sm:block" ref={searchRef}>
          <div className="relative flex items-center group">
            <Search size={15} className="absolute left-3 text-slate-400 group-focus-within:text-purple-600 transition-colors pointer-events-none" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="ค้นหาระบบงานหรือคำสั่ง..." 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 focus:border-purple-600/80 rounded-lg !pl-9 !pr-14 !py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500/10 transition-all font-medium m-0"
            />
            <div className="absolute right-2 flex items-center pointer-events-none">
              <kbd className="hidden md:inline-flex items-center text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                Ctrl K
              </kbd>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && query.length > 0 && (
              <motion.div 
                key="search-dropdown"
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.99 }}
                transition={{ duration: 0.12 }}
                className="absolute top-[115%] left-0 w-full min-w-[320px] bg-white rounded-xl shadow-lg border border-slate-200/90 overflow-hidden z-[100]"
              >
                {filteredResults.length > 0 ? (
                  <ul className="list-none p-1.5 m-0">
                    {filteredResults.map((result, idx) => (
                      <li key={result.path}>
                        <button
                          onClick={() => handleSelect(result.path)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border-none cursor-pointer text-left transition-colors ${
                            idx === selectedIndex 
                              ? 'bg-purple-50 text-purple-900 font-semibold' 
                              : 'bg-transparent text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={idx === selectedIndex ? 'text-purple-600' : 'text-slate-400'}>
                            {result.icon}
                          </span>
                          <span className="text-xs truncate">
                            {result.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-5 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-1.5">
                    <Search size={18} className="text-slate-300" />
                    ไม่พบระบบงานที่ตรงกับคำค้นหา
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Live Connection Pill + Notification + Doctor Profile */}
      <div className="flex items-center shrink-0 gap-3">
        {/* Realtime Live Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>ระบบออนไลน์</span>
        </div>

        <NotificationBell />

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* Minimal Profile Tile */}
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2.5 p-1 pr-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60 group"
          title="คลิกเพื่อแก้ไขโปรไฟล์ส่วนตัว"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200/60 flex items-center justify-center text-purple-700 font-black text-xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitial(user?.ic_name)
            )}
          </div>
          <div className="hidden sm:flex flex-col items-start justify-center">
            <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px] group-hover:text-purple-700 transition-colors">
              {user?.ic_name || 'แพทย์'}
            </span>
            <span className="text-[10px] font-medium text-slate-400 tracking-tight leading-none mt-0.5">
              {user?.position?.name || (isAdmin ? 'ผู้ดูแลระบบ' : 'บุคลากร')} • แก้ไข
            </span>
          </div>
        </div>
      </div>
      
      {/* Profile Edit Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </header>
  );
}
