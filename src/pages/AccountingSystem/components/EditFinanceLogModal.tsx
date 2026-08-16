import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
        <div className="modal-header">
          <h2>แก้ไขรายการรายรับ-รายจ่าย</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              type="button"
              className={`type-btn ${type === 'income' ? 'income active' : ''}`}
              onClick={() => setType('income')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: type === 'income' ? '#10b981' : '#e2e8f0',
                background: type === 'income' ? '#ecfdf5' : 'white',
                color: type === 'income' ? '#047857' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              รายรับ
            </button>
            <button
              type="button"
              className={`type-btn ${type === 'expense' ? 'expense active' : ''}`}
              onClick={() => setType('expense')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: type === 'expense' ? '#ef4444' : '#e2e8f0',
                background: type === 'expense' ? '#fef2f2' : 'white',
                color: type === 'expense' ? '#b91c1c' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              รายจ่าย
            </button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
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
              placeholder="เช่น ค่ารักษาพยาบาล, ค่ายา ฯลฯ"
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
