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
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="print:hidden">
        {/* Header */}
        <PageHeader
          title="ระบบบัญชี & คลังสิ่งของ"
          subtitle="จัดการรายรับ-รายจ่ายของหน่วยงาน และบริหารคลังยา/เวชภัณฑ์"
          icon={<LineChart size={18} />}
          iconTheme="orange"
          badge={{ label: 'ระบบจัดการ (Admin Only)', variant: 'admin' }}
        />

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row bg-slate-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto border border-slate-200/80 mb-4">
          <button 
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap border-none cursor-pointer ${activeTab === 'finance' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
            onClick={() => setActiveTab('finance')}
          >
            <Wallet size={15} /> ระบบบัญชี (การเงิน)
          </button>
          <button 
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap border-none cursor-pointer ${activeTab === 'item' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
            onClick={() => setActiveTab('item')}
          >
            <Package size={15} /> ระบบคลังสิ่งของ
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
