import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden text-slate-800 antialiased">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#fafafa]">
        <div className="print:hidden">
          <Header 
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-7 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
