import { useState, useMemo } from 'react';
import { useFinanceLogs } from '../hooks/useAccountingQueries';
import { useAddFinanceLog, useDeleteFinanceLog } from '../hooks/useAccountingMutations';
import { useAuthStore } from '@/store/authStore';
import { ArrowDownRight, ArrowUpRight, Wallet, Printer, Clock, Trash2, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import FinanceReportModal from './FinanceReportModal';
import EditFinanceLogModal from './EditFinanceLogModal';

export default function FinanceTab() {
  const { user } = useAuthStore();
  const { data: financeLogs = [], isLoading } = useFinanceLogs();
  const addMutation = useAddFinanceLog();
  const deleteMutation = useDeleteFinanceLog();

  const addFinanceLog = (data: any) => addMutation.mutateAsync(data);
  const deleteFinanceLog = (id: string) => deleteMutation.mutateAsync(id);
  
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  // Date filters
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const curr = new Date();
    const day = curr.getDay();
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(curr.setDate(diffToMonday));
    start.setHours(0,0,0,0);
    return start;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const curr = new Date();
    const day = curr.getDay();
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const end = new Date(curr.setDate(diffToMonday + 6));
    end.setHours(23,59,59,999);
    return end;
  });

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) return;
    
    try {
      await addFinanceLog({
        type,
        amount: Number(amount),
        description,
        discord_id: user?.discord_id || ''
      });
      setAmount('');
      setDescription('');
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    }
  };

  const filteredLogs = useMemo(() => {
    return financeLogs.filter(log => {
      const logDate = new Date(log.created_at);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });
  }, [financeLogs, startDate, endDate]);

  const summary = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      if (log.type === 'income') acc.income += log.amount;
      else acc.expense += log.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredLogs]);

  const balance = summary.income - summary.expense;

  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden flex flex-col gap-6">
      {/* Date Filters & Print */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm w-full sm:w-auto">
            <span className="text-sm font-bold text-slate-600">ตั้งแต่:</span>
            <DatePicker 
              selected={startDate} 
              onChange={(date: Date | null) => { if(date) date.setHours(0,0,0,0); setStartDate(date); }}
              selectsStart startDate={startDate} endDate={endDate}
              dateFormat="dd/MM/yyyy"
              className="w-[100px] outline-none text-sm font-bold text-slate-800 bg-transparent cursor-pointer"
            />
            <span className="text-sm font-bold text-slate-600">ถึง:</span>
            <DatePicker 
              selected={endDate} 
              onChange={(date: Date | null) => { if(date) date.setHours(23,59,59,999); setEndDate(date); }}
              selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || undefined}
              dateFormat="dd/MM/yyyy"
              className="w-[100px] outline-none text-sm font-bold text-slate-800 bg-transparent cursor-pointer"
            />
          </div>
          <button 
            onClick={() => {
              setStartDate(null); setEndDate(null);
            }}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            ดูทั้งหมด
          </button>
        </div>
        
        <button 
          onClick={() => setIsReportOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          <Printer size={18} /> ออกรายงาน (Print)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-600">
            <ArrowDownRight size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">รายรับทั้งหมด</h3>
            <p className="text-2xl font-black text-slate-800">฿{summary.income.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-100 text-rose-600">
            <ArrowUpRight size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">รายจ่ายทั้งหมด</h3>
            <p className="text-2xl font-black text-slate-800">฿{summary.expense.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-100 text-blue-600">
            <Wallet size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">ยอดคงเหลือ (Net Balance)</h3>
            <p className={`text-2xl font-black ${balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              ฿{balance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Form & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-1 h-fit">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            บันทึกรายการใหม่
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                type="button"
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-none ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
                onClick={() => setType('income')}
              >
                รายรับ
              </button>
              <button 
                type="button"
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-none ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
                onClick={() => setType('expense')}
              >
                รายจ่าย
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวนเงิน (บาท)</label>
              <input 
                type="number" 
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">รายละเอียด</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุรายละเอียด..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={amount === '' || amount <= 0}
              className={`w-full py-3.5 rounded-xl font-black text-white shadow-lg transition-all border-none mt-2 ${
                type === 'income' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' 
                  : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
            >
              บันทึก{type === 'income' ? 'รายรับ' : 'รายจ่าย'}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col">
          <h2 className="text-xl font-black text-slate-800 mb-6">ประวัติการทำรายการ</h2>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap">วันเวลา</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap">ผู้บันทึก</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap">ประเภท</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap text-right">จำนวนเงิน (฿)</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap pl-6">รายละเอียด</th>
                  {user?.role === 'admin' && <th className="pb-4 font-bold text-slate-500 whitespace-nowrap text-center">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">ไม่มีประวัติการทำรายการ</td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 whitespace-nowrap text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {new Date(log.created_at).toLocaleString('th-TH')}
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap font-bold text-slate-700">{log.users?.ic_name || 'Unknown'}</td>
                      <td className="py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {log.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                        </span>
                      </td>
                      <td className={`py-4 whitespace-nowrap text-right font-black ${log.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {log.type === 'income' ? '+' : '-'}{log.amount.toLocaleString()}
                      </td>
                      <td className="py-4 pl-6 text-slate-600">{log.description || '-'}</td>
                      {user?.role === 'admin' && (
                        <td className="py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingLog(log)}
                              className="p-2 bg-slate-100 text-slate-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border-none"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                Swal.fire({
                                  title: 'ยืนยันการลบ?',
                                  text: "คุณต้องการลบรายการนี้ใช่หรือไม่?",
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#ef4444',
                                  cancelButtonColor: '#94a3b8',
                                  confirmButtonText: 'ใช่, ลบเลย',
                                  cancelButtonText: 'ยกเลิก'
                                }).then(async (result) => {
                                  if (result.isConfirmed) {
                                    await deleteFinanceLog(log.id);
                                  }
                                });
                              }}
                              className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border-none"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      </div>

      {isReportOpen && (
        <FinanceReportModal 
          isOpen={isReportOpen} 
          onClose={() => setIsReportOpen(false)} 
          startDate={startDate}
          endDate={endDate}
        />
      )}
      
      {editingLog && (
        <EditFinanceLogModal
          isOpen={!!editingLog}
          onClose={() => setEditingLog(null)}
          log={editingLog}
        />
      )}
    </div>
  );
}
