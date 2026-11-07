import { useState } from 'react';
import { useAccountingRealtime } from './hooks/useAccountingRealtime';
import FinanceTab from './components/FinanceTab';
import InventoryTab from './components/InventoryTab';
import { Wallet, Package, LineChart } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

export function AccountingSystem() {
  // Connect Realtime
  useAccountingRealtime();

  const [activeTab, setActiveTab] = useState<'finance' | 'item'>('finance');

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      <div className="print:hidden">
        {/* Header */}
        <PageHeader
          title="ระบบบัญชี & คลังสิ่งของ"
          subtitle="จัดการรายรับ-รายจ่ายของหน่วยงาน และบริหารคลังยา/เวชภัณฑ์"
          icon={<LineChart size={24} />}
          iconTheme="orange"
          badge={{ label: 'ระบบจัดการ (Admin Only)', variant: 'admin' }}
        />

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row bg-slate-200/60 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-inner mb-6">
          <button 
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-none cursor-pointer ${activeTab === 'finance' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 bg-transparent'}`}
            onClick={() => setActiveTab('finance')}
          >
            <Wallet size={18} /> ระบบบัญชี (การเงิน)
          </button>
          <button 
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-none cursor-pointer ${activeTab === 'item' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 bg-transparent'}`}
            onClick={() => setActiveTab('item')}
          >
            <Package size={18} /> ระบบคลังสิ่งของ
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'finance' ? <FinanceTab /> : <InventoryTab />}
      </div>
    </div>
  );
}
