import React, { useState, useEffect } from 'react';
import { X, Save, Edit } from 'lucide-react';
import { useUpdateInventoryLog } from '../hooks/useAccountingMutations';

interface EditInventoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any; // Using any for simplicity
}

export default function EditInventoryLogModal({ isOpen, onClose, log }: EditInventoryLogModalProps) {
  const updateMutation = useUpdateInventoryLog();
  
  const [type, setType] = useState<'receive' | 'disburse'>('receive');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (log && isOpen) {
      setType(log.type);
      setItemName(log.item_name);
      setQuantity(log.quantity);
      setDescription(log.description || '');
    }
  }, [log, isOpen]);

  if (!isOpen || !log) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity === '' || Number(quantity) <= 0 || !itemName.trim()) return;

    updateMutation.mutate({
      id: log.id,
      type,
      item_name: itemName.trim(),
      quantity: Number(quantity),
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
            <div className="bg-sky-100 text-sky-600 p-2 rounded-xl">
              <Edit size={20} />
            </div>
            แก้ไขคลังยา
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
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              required
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม (ถ้ามี)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียด..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-medium resize-none"
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
              disabled={updateMutation.isPending || quantity === '' || Number(quantity) <= 0 || !itemName.trim()}
              className="flex-1 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/30 transition-all disabled:opacity-50 border-none flex items-center justify-center gap-2"
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
