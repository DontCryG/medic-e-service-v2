import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useMaintenanceMode, useSaveMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useAuthStore } from '@/store/authStore';
import { isAdmin } from '@/utils/permissions';
import { Wrench } from 'lucide-react';
import { showConfirmDialog, showSuccessAlert } from '@/utils/alert';

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const isAdminRole = isAdmin(user?.role);
  const { data: maintenance } = useMaintenanceMode();
  const saveMaintenanceMutation = useSaveMaintenanceMode();

  const handleQuickDisable = async () => {
    const result = await showConfirmDialog({
      title: 'ปิดโหมดปรับปรุงและเปิดระบบ?',
      text: 'บุคลากรทางการแพทย์ทุกคนจะสามารถเข้าใช้งานระบบได้ตามปกติทันที',
      icon: 'question',
      confirmButtonText: 'ใช่, เปิดระบบตามปกติ',
      confirmButtonColor: '#7e22ce'
    });

    if (result.isConfirmed && maintenance) {
      saveMaintenanceMutation.mutate({
        ...maintenance,
        enabled: false,
        updated_by: user?.ic_name || 'ผู้ดูแลระบบ',
        updated_at: new Date().toISOString()
      }, {
        onSuccess: () => {
          showSuccessAlert('สำเร็จ', 'ปิดโหมดปรับปรุงและเปิดระบบตามปกติแล้ว');
        }
      });
    }
  };
  
  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden text-slate-800 antialiased font-sans print:h-auto print:min-h-0 print:overflow-visible print:block print:bg-white">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#fafafa] print:h-auto print:min-h-0 print:overflow-visible print:block print:static print:bg-white">
        {/* Top Warning Banner for Admins when Maintenance Mode is ON */}
        {isAdminRole && maintenance?.enabled && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs shrink-0 select-none z-50 print:hidden">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <Wrench size={14} className="shrink-0" />
              <span>
                <strong>โหมดกำลังพัฒนา/ปรับปรุงระบบเปิดใช้งานอยู่:</strong> บุคลากรทั่วไปจะไม่สามารถเข้าใช้งานหน้าเว็บได้
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => navigate('/settings')}
                className="px-2.5 py-0.5 rounded bg-black/20 hover:bg-black/30 text-white border-none cursor-pointer text-xs font-semibold transition-colors"
              >
                จัดการการตั้งค่า
              </button>
              <button
                onClick={handleQuickDisable}
                disabled={saveMaintenanceMutation.isPending}
                className="px-2.5 py-0.5 rounded bg-white text-amber-900 hover:bg-amber-50 border-none cursor-pointer text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
              >
                {saveMaintenanceMutation.isPending ? 'กำลังเปิดระบบ...' : 'ปิดโหมดปรับปรุง (เปิดระบบ)'}
              </button>
            </div>
          </div>
        )}

        <div className="print:hidden">
          <Header 
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-7 relative print:h-auto print:min-h-0 print:overflow-visible print:block print:p-0 print:m-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
