import { useState } from 'react';
import { Settings, Users, Shield, DollarSign, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { broadcastForceReload } from '@/hooks/useAppRealtime';

import PositionSettings from './SystemSettings/components/PositionSettings';
import GangFamilySettings from './SystemSettings/components/GangFamilySettings';
import PricingSettings from './SystemSettings/components/PricingSettings';

type Tab = 'positions' | 'gangs' | 'pricing';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('positions');

  const handleForceRefresh = async () => {
    const result = await Swal.fire({
      title: 'บังคับ Refresh หน้าจอ?',
      text: 'การกระทำนี้จะสั่งให้หน้าเว็บของผู้ใช้งานทุกคน (ที่กำลังเปิดเว็บอยู่) ถูก Refresh ใหม่ทันที เพื่ออัปเดตโค้ดล่าสุด',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, บังคับ Refresh',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      broadcastForceReload();
      await Swal.fire('สำเร็จ!', 'ส่งคำสั่ง Refresh ไปยังทุกคนแล้ว', 'success');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 m-0 flex items-center gap-3">
            <Settings size={32} className="text-[var(--primary)]" />
            ตั้งค่าระบบ
          </h1>
          <p className="text-slate-500 mt-2 text-[0.95rem]">
            จัดการข้อมูลตำแหน่ง, แก๊ง, ครอบครัว, และตั้งค่าราคาการรักษา
          </p>
        </div>
        <button 
          onClick={handleForceRefresh}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md border-2 border-red-500 text-red-500 font-semibold bg-transparent hover:bg-red-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
          Force Refresh (All Users)
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-[16px] w-fit mb-8 overflow-x-auto max-w-full">
        <button 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'positions' ? 'bg-white text-[var(--primary)] shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('positions')}
        >
          <Users size={18} />
          ตำแหน่งและค่าตอบแทน
        </button>
        <button 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'gangs' ? 'bg-white text-[var(--primary)] shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('gangs')}
        >
          <Shield size={18} />
          กลุ่มและแฟมิลี่
        </button>
        <button 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
            activeTab === 'pricing' ? 'bg-white text-[var(--primary)] shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('pricing')}
        >
          <DollarSign size={18} />
          ตั้งค่าทั่วไปและเรทราคา
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)]">
        {activeTab === 'positions' && <PositionSettings />}
        {activeTab === 'gangs' && <GangFamilySettings />}
        {activeTab === 'pricing' && <PricingSettings />}
      </div>
    </div>
  );
}
