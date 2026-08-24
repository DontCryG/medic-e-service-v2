import { useState } from 'react';
import { Settings, Users, Shield, DollarSign, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { broadcastForceReload } from '@/hooks/useAppRealtime';
import './SystemSettings.css';

import PositionSettings from './SystemSettings/components/PositionSettings';
import GangFamilySettings from './SystemSettings/components/GangFamilySettings';
import PricingSettings from './SystemSettings/components/PricingSettings';

type Tab = 'positions' | 'gangs' | 'pricing';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('positions');

  const handleForceRefresh = async () => {
    const result = await Swal.fire({
      title: 'บังคับ Refresh หน้าจอ?',
      text: 'การกระทำนี้จะสั่งให้หน้าเว็บของผู้ใช้งานทุกคน (ที่กำลังเปิดเว็บอยู่) ถูก Refresh ใหม่ทันที (เพื่ออัปเดตโค้ดล่าสุด)',
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
    <div className="settings-container fade-in">
      <div className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={32} className="text-primary" />
            ตั้งค่าระบบ
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>จัดการข้อมูลตำแหน่ง แก๊ง ครอบครัว และตั้งค่าราคาการรักษา</p>
        </div>
        <button 
          onClick={handleForceRefresh}
          className="settings-tab-btn"
          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <RefreshCw size={18} />
          Force Refresh (All Users)
        </button>
      </div>

      <div className="settings-tabs" style={{ marginBottom: '1rem', width: 'fit-content' }}>
        <button 
          className={`settings-tab-btn ${activeTab === 'positions' ? 'active positions' : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          <Users size={18} />
          ตำแหน่งและค่าตอบแทน
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'gangs' ? 'active general' : ''}`}
          onClick={() => setActiveTab('gangs')}
        >
          <Shield size={18} />
          กลุ่มและแฟมิลี่
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'pricing' ? 'active reports' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <DollarSign size={18} />
          ตั้งค่าทั่วไปและเรทราคา
        </button>
      </div>

      <div className="settings-card">
        {activeTab === 'positions' && <PositionSettings />}
        {activeTab === 'gangs' && <GangFamilySettings />}
        {activeTab === 'pricing' && <PricingSettings />}
      </div>
    </div>
  );
}
