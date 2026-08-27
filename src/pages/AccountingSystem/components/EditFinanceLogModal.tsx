import React, { useState, useEffect } from 'react';
import { X, Save, Edit } from 'lucide-react';
import { useUpdateFinanceLog } from '../hooks/useAccountingMutations';

interface EditFinanceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any; // Using any for simplicity or you can define type
}

export default function EditFinanceLogModal({ isOpen, onClose, log }: EditFinanceLogModalProps) {
  const updateMutation = useUpdateFinanceLog();
  
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (log && isOpen) {
      setType(log.type);
      setAmount(log.amount);
      setDescription(log.description || '');
    }
  }, [log, isOpen]);

  if (!isOpen || !log) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || Number(amount) <= 0) return;

    updateMutation.mutate({
      id: log.id,
      type,
      amount: Number(amount),
      description
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
              <Edit size={20} />
            </div>
            แก้ไขรายรับ-รายจ่าย
          </h2>
          <button 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
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
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              required
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม (ถ้ามี)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น ค่าไฟ, ค่ายา, ฯลฯ"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors border-none"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || amount === '' || Number(amount) <= 0}
              className="flex-1 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 border-none flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
