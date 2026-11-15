import { useState } from 'react';
import { Settings, Users, Shield, Sliders, RefreshCw, Wrench } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog, showSuccessAlert } from '@/utils/alert';
import { broadcastForceReload } from '@/hooks/useAppRealtime';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

import PositionSettings from './SystemSettings/components/PositionSettings';
import GangFamilySettings from './SystemSettings/components/GangFamilySettings';
import CategorizedSettings from './SystemSettings/components/CategorizedSettings';
import MaintenanceSettings from './SystemSettings/components/MaintenanceSettings';

type Tab = 'system' | 'positions' | 'gangs' | 'maintenance';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('system');
  const { data: maintenance } = useMaintenanceMode();

  const handleForceRefresh = async () => {
    const result = await showConfirmDialog({
      title: 'บังคับ Refresh หน้าจอ?',
      text: 'การกระทำนี้จะสั่งให้หน้าเว็บของผู้ใช้งานทุกคน (ที่กำลังเปิดเว็บอยู่) ถูก Refresh ใหม่ทันที เพื่ออัปเดตโค้ดล่าสุด',
      icon: 'warning',
      confirmButtonText: 'ใช่, บังคับ Refresh',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      broadcastForceReload();
      await showSuccessAlert('สำเร็จ!', 'ส่งคำสั่ง Refresh ไปยังทุกคนแล้ว');
      window.location.reload();
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      <PageHeader
        title="ตั้งค่าระบบ (System Settings)"
        subtitle="จัดการนโยบายระบบ เกณฑ์โบนัส กฎการลา เรทราคาการรักษา ตำแหน่ง และโหมดปรับปรุงระบบ"
        icon={<Settings size={18} />}
        iconTheme="orange"
        badge={{ label: 'ระบบจัดการ (Admin Only)', variant: 'admin' }}
        actions={
          <button 
            onClick={handleForceRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 font-semibold text-xs bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
            title="ส่งคำสั่งรีเฟรชหน้าต่างของผู้ใช้ทุกคน"
          >
            <RefreshCw size={14} />
            Force Refresh All Users
          </button>
        }
      />

      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 w-fit mb-4 overflow-x-auto max-w-full">
        <button 
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'system' ? 'bg-white text-purple-600 shadow-sm font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('system')}
        >
          <Sliders size={15} />
          นโยบายและการตั้งค่าระบบ
        </button>
        <button 
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'positions' ? 'bg-white text-purple-600 shadow-sm font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('positions')}
        >
          <Users size={15} />
          ตำแหน่งและค่าตอบแทน
        </button>
        <button 
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'gangs' ? 'bg-white text-purple-600 shadow-sm font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('gangs')}
        >
          <Shield size={15} />
          กลุ่มและแฟมิลี่
        </button>
        <button 
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'maintenance' ? 'bg-white text-amber-600 shadow-sm font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Wrench size={15} className={maintenance?.enabled ? 'text-amber-500 animate-spin' : ''} />
          <span>โหมดปรับปรุงระบบ (Maintenance)</span>
          {maintenance?.enabled && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200/80">
        {activeTab === 'system' && <CategorizedSettings />}
        {activeTab === 'positions' && <PositionSettings />}
        {activeTab === 'gangs' && <GangFamilySettings />}
        {activeTab === 'maintenance' && <MaintenanceSettings />}
      </div>
    </div>
  );
}
