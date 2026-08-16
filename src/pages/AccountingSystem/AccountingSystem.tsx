import { useState } from 'react';
import { useAccountingRealtime } from './hooks/useAccountingRealtime';
import FinanceTab from './components/FinanceTab';
import InventoryTab from './components/InventoryTab';
import { Wallet, Package, LineChart } from 'lucide-react';
import '../AccountingSystem.css';

export function AccountingSystem() {
  // Connect Realtime
  useAccountingRealtime();

  const [activeTab, setActiveTab] = useState<'finance' | 'item'>('finance');

  return (
    <div className="accounting-container animate-fade-in">
      <div className="accounting-header">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LineChart size={32} color="var(--primary)" />
            ระบบบัญชี & คลังสิ่งของ
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            จัดการรายรับ-รายจ่ายของหน่วยงาน และระบบเบิกจ่ายสิ่งของ
          </p>
        </div>
      </div>

      <div className="accounting-tabs" style={{ marginBottom: '2rem' }}>
        <button 
          className={`accounting-tab-btn ${activeTab === 'finance' ? 'active finance' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <Wallet size={18} /> ระบบบัญชี (การเงิน)
        </button>
        <button 
          className={`accounting-tab-btn ${activeTab === 'item' ? 'active item' : ''}`}
          onClick={() => setActiveTab('item')}
        >
          <Package size={18} /> ระบบคลังสิ่งของ
        </button>
      </div>

      {activeTab === 'finance' ? <FinanceTab /> : <InventoryTab />}
    </div>
  );
}
