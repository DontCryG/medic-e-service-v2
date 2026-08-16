import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useUpdateInventoryLog } from '../hooks/useAccountingMutations';

interface EditInventoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
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
      setItemName(log.item_name || '');
      setQuantity(log.quantity);
      setDescription(log.description || '');
    }
  }, [log, isOpen]);

  if (!isOpen || !log) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || quantity === '' || Number(quantity) <= 0) return;

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
        <div className="modal-header">
          <h2>แก้ไขรายการคลังสิ่งของ</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              type="button"
              className={`type-btn ${type === 'receive' ? 'income active' : ''}`}
              onClick={() => setType('receive')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: type === 'receive' ? '#10b981' : '#e2e8f0',
                background: type === 'receive' ? '#ecfdf5' : 'white',
                color: type === 'receive' ? '#047857' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              รับเข้า
            </button>
            <button
              type="button"
              className={`type-btn ${type === 'disburse' ? 'expense active' : ''}`}
              onClick={() => setType('disburse')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: type === 'disburse' ? '#ef4444' : '#e2e8f0',
                background: type === 'disburse' ? '#fef2f2' : 'white',
                color: type === 'disburse' ? '#b91c1c' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              เบิกออก
            </button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
              ชื่อสิ่งของ
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="เช่น ผ้าพันแผล, ยาดม"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
              จำนวนรวม (ชิ้น)
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              required
              min="1"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
              รายละเอียด (ถ้ามี)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุหมายเหตุ"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
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
