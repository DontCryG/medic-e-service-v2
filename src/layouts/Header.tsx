import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getInitial } from '../pages/PersonnelSystem/utils/personnelUtils';
import { Search, Menu, PanelLeftClose, PanelLeftOpen, LayoutDashboard, LayoutGrid, Clock, CalendarDays, Users, Banknote, Wallet, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationBell from '@/components/common/NotificationBell';

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export default function Header({ setIsMobileMenuOpen, isSidebarCollapsed, setIsSidebarCollapsed }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'director' || user?.role === 'management';

  const searchIndex = [
    { title: 'กระดานหลัก (Dashboard)', path: '/dashboard', icon: <LayoutDashboard size={18}/>, keywords: ['หน้าแรก', 'home', 'dashboard'], requireAdmin: false },
    { title: 'ระบบรับคิวแพทย์ (Queue)', path: '/queue', icon: <LayoutGrid size={18}/>, keywords: ['คิว', 'queue', 'ผู้ป่วย'], requireAdmin: false },
    { title: 'ระบบเข้าเวร (Duty)', path: '/duty', icon: <Clock size={18}/>, keywords: ['เวร', 'เข้าเวร', 'ออกเวร', 'duty'], requireAdmin: false },
    { title: 'ระบบลางาน (Leave)', path: '/leave', icon: <CalendarDays size={18}/>, keywords: ['ลา', 'ลางาน', 'พักร้อน', 'leave'], requireAdmin: false },
    { title: 'ระบบจัดการบุคลากร (Personnel)', path: '/personnel', icon: <Users size={18}/>, keywords: ['หมอ', 'บุคลากร', 'แพทย์', 'personnel'], requireAdmin: true },
    { title: 'ระบบคำนวณเงินเดือน (Salary)', path: '/salary', icon: <Banknote size={18}/>, keywords: ['เงินเดือน', 'ค่ารอบ', 'salary'], requireAdmin: true },
    { title: 'ระบบบัญชี & คลัง (Accounting)', path: '/accounting', icon: <Wallet size={18}/>, keywords: ['บัญชี', 'เงิน', 'เบิก', 'คลัง', 'ยา', 'accounting'], requireAdmin: true },
    { title: 'ตั้งค่าระบบ (Settings)', path: '/settings', icon: <Settings size={18}/>, keywords: ['ตั้งค่า', 'settings', 'config'], requireAdmin: true },
  ];

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredResults = searchIndex.filter(item => {
    if (item.requireAdmin && !isAdmin) return false;
    if (!query) return false;
    const lowerQuery = query.toLowerCase();
    return item.title.toLowerCase().includes(lowerQuery) || item.keywords.some(k => k.toLowerCase().includes(lowerQuery));
  });

  useEffect(() => { setSelectedIndex(0); }, [query]);

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
    <header className="w-full h-[80px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-50 sticky top-0">
      
      {/* Left Area: Toggle & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button 
          className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer shrink-0"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={22} />
        </button>

        <button
          className="hidden lg:flex p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-[#7e22ce] transition-colors border-none bg-transparent cursor-pointer shrink-0"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
        </button>
        
        <div className="relative w-full max-w-[320px] hidden sm:block ml-2" ref={searchRef}>
          <div className="relative flex items-center group">
            <Search size={18} className="absolute left-4 text-slate-400 group-focus-within:text-[#7e22ce] transition-colors" />
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
              className="w-full bg-[#f1f5f9] border border-transparent text-slate-800 text-[0.95rem] rounded-full !pl-11 !pr-4 !py-2.5 outline-none focus:bg-white focus:border-[#7e22ce] focus:ring-4 focus:ring-[#7e22ce]/10 transition-all font-medium placeholder:text-slate-400 m-0"
            />
          </div>

          <AnimatePresence>
            {isOpen && query.length > 0 && (
              <motion.div 
                key="search-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-[120%] left-0 w-full min-w-[300px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100]"
              >
                {filteredResults.length > 0 ? (
                  <ul className="list-none p-2 m-0">
                    {filteredResults.map((result, idx) => (
                      <li key={result.path}>
                        <button
                          onClick={() => handleSelect(result.path)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-none cursor-pointer text-left transition-all duration-150 ${idx === selectedIndex ? 'bg-[#7e22ce]/10 text-[#7e22ce]' : 'bg-transparent text-slate-700'}`}
                        >
                          <span className={`flex items-center justify-center ${idx === selectedIndex ? 'text-[#7e22ce]' : 'text-slate-400'}`}>
                            {result.icon}
                          </span>
                          <span className={`font-medium ${idx === selectedIndex ? 'font-bold' : ''}`}>
                            {result.title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm font-medium flex flex-col items-center gap-2">
                    <Search size={24} className="text-slate-300" />
                    ไม่พบเมนูที่ค้นหา
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Area: Profile */}
      <div className="flex items-center shrink-0 ml-4 gap-2">
        <NotificationBell />
        <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>
        <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-[100px] hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
          <div className="w-[42px] h-[42px] rounded-full bg-indigo-50 shadow-sm flex items-center justify-center text-[#7e22ce] font-bold overflow-hidden shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitial(user?.ic_name)
            )}
          </div>
          <div className="hidden sm:flex flex-col items-start justify-center">
            <span className="text-[0.9rem] font-bold text-slate-800 leading-tight">{user?.ic_name || 'Guest'}</span>
            <span className="text-[0.65rem] font-bold text-[#7e22ce] uppercase tracking-wider mt-0.5">{user?.position?.name || 'Loading...'}</span>
          </div>
        </div>
      </div>
      
    </header>
  );
}
