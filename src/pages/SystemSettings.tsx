import { useState } from 'react';
import { Settings, Users, Shield, DollarSign } from 'lucide-react';
import './SystemSettings.css';

import PositionSettings from './SystemSettings/components/PositionSettings';
import GangFamilySettings from './SystemSettings/components/GangFamilySettings';
import PricingSettings from './SystemSettings/components/PricingSettings';

type Tab = 'positions' | 'gangs' | 'pricing';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<Tab>('positions');

  return (
    <div className="settings-container fade-in">
      <div className="settings-header">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={32} className="text-primary" />
            ตั้งค่าระบบ
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>จัดการข้อมูลพื้นฐานและตั้งค่าการทำงานของระบบ</p>
        </div>
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
