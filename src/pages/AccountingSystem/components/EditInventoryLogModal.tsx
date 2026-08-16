import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useUpdateInventoryLog } from '../hooks/useAccountingMutations';
import { useInventoryStock } from '../hooks/useAccountingQueries';

interface EditInventoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
}

export default function EditInventoryLogModal({ isOpen, onClose, log }: EditInventoryLogModalProps) {
  const updateMutation = useUpdateInventoryLog();
  const stocks = useInventoryStock();
  
  const [type, setType] = useState<'receive' | 'disburse'>('receive');
  const [itemName, setItemName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
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

          <div className="modal-form-group" style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>
              ชื่อสิ่งของ
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
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
            
            {/* Custom Autocomplete Dropdown */}
            {showDropdown && stocks.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 50
              }}>
                {stocks.filter(s => s.name.toLowerCase().includes(itemName.toLowerCase())).map(s => (
                  <div 
                    key={s.name}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur
                      setItemName(s.name);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <span style={{ fontWeight: 500, color: '#334155' }}>{s.name}</span>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      color: s.quantity <= 0 ? '#ef4444' : '#64748b',
                      background: s.quantity <= 0 ? '#fef2f2' : '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      เหลือ {s.quantity.toLocaleString()} ชิ้น
                    </span>
                  </div>
                ))}
              </div>
            )}
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
