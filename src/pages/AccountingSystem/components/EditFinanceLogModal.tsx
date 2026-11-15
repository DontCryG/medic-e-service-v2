import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { useUpdateFinanceLog } from '../hooks/useAccountingMutations';

interface EditFinanceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
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
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div 
        className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200/90 animate-in zoom-in-98 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <Edit3 size={15} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 m-0">
              แก้ไขรายการการเงิน
            </h2>
          </div>
          <button 
            type="button" 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all border-none cursor-pointer ${
                type === 'income' 
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold' 
                  : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
              onClick={() => setType('income')}
            >
              รายรับ (+)
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all border-none cursor-pointer ${
                type === 'expense' 
                  ? 'bg-white text-rose-700 shadow-2xs font-bold' 
                  : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
              onClick={() => setType('expense')}
            >
              รายจ่าย (-)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">จำนวนเงิน (บาท) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              required
              min="1"
              className="w-full px-3 py-2 rounded-lg border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all font-mono font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุที่มาหรือหมายเหตุของรายการ..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all resize-none font-medium"
            />
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white" 
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              disabled={updateMutation.isPending}
            >
              <Save size={13} />
              {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
