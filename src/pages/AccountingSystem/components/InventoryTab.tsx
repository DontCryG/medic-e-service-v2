import { useState, useMemo } from 'react';
import { useInventoryLogs, useInventoryStock } from '../hooks/useAccountingQueries';
import { useAddInventoryLog, useDeleteInventoryLog } from '../hooks/useAccountingMutations';
import { useAuthStore } from '@/store/authStore';
import { PackagePlus, PackageMinus, Package, Printer, Clock, Trash2, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import InventoryReportModal from './InventoryReportModal';
import EditInventoryLogModal from './EditInventoryLogModal';

export default function InventoryTab() {
  const { user } = useAuthStore();
  const { data: inventoryLogs = [], isLoading } = useInventoryLogs();
  const stocks = useInventoryStock();
  const addMutation = useAddInventoryLog();
  const deleteMutation = useDeleteInventoryLog();

  const addInventoryLog = (data: any) => addMutation.mutateAsync(data);
  const deleteInventoryLog = (id: string) => deleteMutation.mutateAsync(id);
  
  const [type, setType] = useState<'receive' | 'disburse'>('receive');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
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
    if (quantity === '' || quantity <= 0 || !itemName.trim()) return;
    
    try {
      await addInventoryLog({
        type,
        item_name: itemName.trim(),
        quantity: Number(quantity),
        description,
        discord_id: user?.discord_id || ''
      });
      setItemName('');
      setQuantity('');
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
    return inventoryLogs.filter(log => {
      const logDate = new Date(log.created_at);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });
  }, [inventoryLogs, startDate, endDate]);

  const summary = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      if (log.type === 'receive') acc.receive += log.quantity;
      else acc.disburse += log.quantity;
      return acc;
    }, { receive: 0, disburse: 0 });
  }, [filteredLogs]);



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
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5"
        >
          <Printer size={18} /> ออกรายงาน (Print)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-600">
            <PackagePlus size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">รับเข้า (ชิ้น)</h3>
            <p className="text-2xl font-black text-slate-800">{summary.receive.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-600">
            <PackageMinus size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">เบิกออก (ชิ้น)</h3>
            <p className="text-2xl font-black text-slate-800">{summary.disburse.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-100 text-purple-600">
            <Package size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">จำนวนรายการสิ่งของทั้งหมด</h3>
            <p className="text-2xl font-black text-slate-800">
              {stocks.length} รายการ
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
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-none ${type === 'receive' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
                onClick={() => setType('receive')}
              >
                รับเข้า
              </button>
              <button 
                type="button"
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-none ${type === 'disburse' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
                onClick={() => setType('disburse')}
              >
                เบิกออก
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อสิ่งของ</label>
              <input 
                type="text" 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="ระบุชื่อสิ่งของ..."
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">จำนวน (ชิ้น)</label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="0"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-medium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุรายละเอียด (ถ้ามี)..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-medium resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={quantity === '' || quantity <= 0 || !itemName.trim()}
              className={`w-full py-3.5 rounded-xl font-black text-white shadow-lg transition-all border-none mt-2 ${
                type === 'receive' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' 
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
            >
              บันทึก{type === 'receive' ? 'รับเข้า' : 'เบิกออก'}
            </button>
          </form>
        </div>

        {/* Table & Current Stock */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col">
          
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">สถานะคลังยาปัจจุบัน</h2>
            {stocks.length === 0 ? (
              <div className="text-slate-500 text-sm font-medium">ไม่มีรายการสิ่งของในคลังยา</div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {stocks.map(stock => (
                  <div key={stock.name} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex items-center gap-2">
                    <span className="font-bold text-slate-700">{stock.name}</span>
                    <span className={`font-black ${stock.quantity <= 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {stock.quantity.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-800 mb-4">ประวัติการทำรายการ</h2>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap">วันเวลา</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap">ผู้ทำรายการ</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap">ประเภท</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap">สิ่งของ</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap text-right">จำนวน</th>
                  <th className="pb-4 font-bold text-slate-500 whitespace-nowrap pl-6">รายละเอียด</th>
                  {user?.role === 'admin' && <th className="pb-4 font-bold text-slate-500 whitespace-nowrap text-center">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">ไม่มีประวัติการทำรายการ</td>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.type === 'receive' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {log.type === 'receive' ? 'รับเข้า' : 'เบิกออก'}
                        </span>
                      </td>
                      <td className="py-4 whitespace-nowrap font-bold text-slate-700">{log.item_name}</td>
                      <td className={`py-4 whitespace-nowrap text-right font-black ${log.type === 'receive' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {log.type === 'receive' ? '+' : '-'}{log.quantity.toLocaleString()}
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
                                    await deleteInventoryLog(log.id);
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
        <InventoryReportModal 
          isOpen={isReportOpen} 
          onClose={() => setIsReportOpen(false)} 
          startDate={startDate}
          endDate={endDate}
        />
      )}
      
      {editingLog && (
        <EditInventoryLogModal
          isOpen={!!editingLog}
          onClose={() => setEditingLog(null)}
          log={editingLog}
        />
      )}
    </div>
  );
}
