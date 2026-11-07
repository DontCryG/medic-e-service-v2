import { useState } from 'react';
import { Settings, Users, Shield, DollarSign, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog, showSuccessAlert } from '@/utils/alert';
import { broadcastForceReload } from '@/hooks/useAppRealtime';

import PositionSettings from './SystemSettings/components/PositionSettings';
import GangFamilySettings from './SystemSettings/components/GangFamilySettings';
import PricingSettings from './SystemSettings/components/PricingSettings';

type Tab = 'positions' | 'gangs' | 'pricing';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('positions');

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
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <PageHeader
        title="ตั้งค่าระบบ (System Settings)"
        subtitle="จัดการข้อมูลตำแหน่ง อัตราค่าตอบแทน รายชื่อแก๊ง/ครอบครัว และราคาการรักษา"
        icon={<Settings size={24} />}
        iconTheme="orange"
        badge={{ label: 'ระบบจัดการ (Admin Only)', variant: 'admin' }}
        actions={
          <button 
            onClick={handleForceRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-300 text-rose-600 font-bold text-xs bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer shadow-sm"
            title="ส่งคำสั่งรีเฟรชหน้าต่างของผู้ใช้ทุกคน"
          >
            <RefreshCw size={14} />
            Force Refresh All Users
          </button>
        }
      />

      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-fit mb-8 overflow-x-auto max-w-full">
        <button 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'positions' ? 'bg-white text-purple-600 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('positions')}
        >
          <Users size={18} />
          ตำแหน่งและค่าตอบแทน
        </button>
        <button 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'gangs' ? 'bg-white text-purple-600 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('gangs')}
        >
          <Shield size={18} />
          กลุ่มและแฟมิลี่
        </button>
        <button 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'pricing' ? 'bg-white text-purple-600 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('pricing')}
        >
          <DollarSign size={18} />
          ตั้งค่าทั่วไปและเรทราคา
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-200/80 shadow-sm">
        {activeTab === 'positions' && <PositionSettings />}
        {activeTab === 'gangs' && <GangFamilySettings />}
        {activeTab === 'pricing' && <PricingSettings />}
      </div>
    </div>
  );
}
