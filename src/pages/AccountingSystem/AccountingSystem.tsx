import { useState } from 'react';
import { useAccountingRealtime } from './hooks/useAccountingRealtime';
import FinanceTab from './components/FinanceTab';
import InventoryTab from './components/InventoryTab';
import { Wallet, Package, LineChart } from 'lucide-react';

export function AccountingSystem() {
  // Connect Realtime
  useAccountingRealtime();

  const [activeTab, setActiveTab] = useState<'finance' | 'item'>('finance');

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      <div className="print:hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 mb-2">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
              <LineChart size={28} />
            </div>
            ระบบบัญชี & คลังยา
          </h1>
          <p className="text-slate-500 font-medium ml-1">
            จัดการรายรับ-รายจ่ายของคลินิก และระบบคลังยา
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row bg-slate-200/60 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto shadow-inner mb-8">
        <button 
          className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-none ${activeTab === 'finance' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 bg-transparent'}`}
          onClick={() => setActiveTab('finance')}
        >
          <Wallet size={18} /> ระบบบัญชี (การเงิน)
        </button>
        <button 
          className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-none ${activeTab === 'item' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 bg-transparent'}`}
          onClick={() => setActiveTab('item')}
        >
          <Package size={18} /> ระบบคลังยา
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
