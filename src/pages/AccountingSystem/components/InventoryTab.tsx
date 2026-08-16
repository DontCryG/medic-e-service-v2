import { useState } from 'react';
import { Package, ArrowDownToLine, ArrowUpFromLine, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useInventoryLogs, useInventoryStock } from '../hooks/useAccountingQueries';
import { useAddInventoryLog } from '../hooks/useAccountingMutations';
import InventoryReportModal from './InventoryReportModal';
import CustomDatePicker from '@/components/common/CustomDatePicker';
import Swal from 'sweetalert2';

export default function InventoryTab() {
  const { user } = useAuthStore();
  const { data: logs = [], isLoading } = useInventoryLogs();
  const addMutation = useAddInventoryLog();
  const stocks = useInventoryStock();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Date Range Filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [type, setType] = useState<'receive' | 'disburse'>('receive');
  const [itemName, setItemName] = useState('');
  
  // States for receive
  const [receiveQuantity, setReceiveQuantity] = useState<number | ''>('');
  
  // States for disburse
  const [qtyPerPerson, setQtyPerPerson] = useState<number | ''>('');
  const [peopleCount, setPeopleCount] = useState<number | ''>('');
  
  const [description, setDescription] = useState('');

  // Filter logs by date range
  const filteredLogs = logs.filter(log => {
    if (!startDate && !endDate) return true;
    const logDate = new Date(log.created_at);
    logDate.setHours(0, 0, 0, 0);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      if (logDate > end) return false;
    }
    return true;
  });

  const totalItemsCount = stocks.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalReceive = filteredLogs.filter(l => l.type === 'receive').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalDisburse = filteredLogs.filter(l => l.type === 'disburse').reduce((acc, curr) => acc + curr.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.discord_id || !itemName.trim()) return;

    let finalQuantity = 0;
    let finalDescription = description;
    let metadata = null;

    if (type === 'receive') {
      if (receiveQuantity === '' || receiveQuantity <= 0) return;
      finalQuantity = Number(receiveQuantity);
    } else {
      if (qtyPerPerson === '' || qtyPerPerson <= 0 || peopleCount === '' || peopleCount <= 0) return;
      
      finalQuantity = Number(qtyPerPerson) * Number(peopleCount);
      
      // Check stock
      const currentStock = stocks.find(s => s.name.toLowerCase() === itemName.trim().toLowerCase())?.quantity || 0;
      if (finalQuantity > currentStock) {
        Swal.fire({
          icon: 'error',
          title: 'สต็อกไม่เพียงพอ!',
          text: `คุณต้องการแจก ${finalQuantity} ชิ้น แต่มีสต็อกเพียง ${currentStock} ชิ้น`
        });
        return;
      }

      // Auto format description
      const autoDesc = `แจก ${qtyPerPerson} ชิ้น/คน จำนวน ${peopleCount} คน (รวม ${finalQuantity} ชิ้น)`;
      finalDescription = description ? `${autoDesc}\nหมายเหตุ: ${description}` : autoDesc;
      
      metadata = {
        qty_per_person: Number(qtyPerPerson),
        people_count: Number(peopleCount)
      };
    }

    addMutation.mutate({
      discord_id: user.discord_id,
      type,
      item_name: itemName.trim(),
      quantity: finalQuantity,
      description: finalDescription,
      metadata
    }, {
      onSuccess: () => {
        setItemName('');
        setReceiveQuantity('');
        setQtyPerPerson('');
        setPeopleCount('');
        setDescription('');
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Date Range Filter */}
      <div className="table-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', minWidth: 0, padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>สรุปรายงานช่วงวันที่:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CustomDatePicker value={startDate} onChange={setStartDate} placeholder="เริ่มต้น" />
            <span style={{ color: '#64748b' }}>ถึง</span>
            <CustomDatePicker value={endDate} onChange={setEndDate} placeholder="สิ้นสุด" />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem' }}
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsReportOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#334155',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '0.95rem'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          ดูรายงานสรุป
        </button>
      </div>

      <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Total Items Card */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#475569', padding: '0.5rem 1rem', color: 'white' }}>
            <Package size={24} />
          </div>
          <div style={{ background: '#f1f5f9', padding: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>สิ่งของคงคลังรวม</h3>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#475569', marginTop: '0.25rem' }}>{totalItemsCount.toLocaleString()} ชิ้น</p>
          </div>
        </div>

        {/* Receive Card */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#0ea5e9', padding: '0.5rem 1rem', color: 'white' }}>
            <ArrowDownToLine size={24} />
          </div>
          <div style={{ background: '#e0f2fe', padding: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>รับเข้าสะสม</h3>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#0369a1', marginTop: '0.25rem' }}>{totalReceive.toLocaleString()} ชิ้น</p>
          </div>
        </div>

        {/* Disburse Card */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#f59e0b', padding: '0.5rem 1rem', color: 'white' }}>
            <ArrowUpFromLine size={24} />
          </div>
          <div style={{ background: '#fef3c7', padding: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>เบิกออกสะสม</h3>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#b45309', marginTop: '0.25rem' }}>{totalDisburse.toLocaleString()} ชิ้น</p>
          </div>
        </div>

      </div>

      <div className="content-grid">
        <div className="form-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>บันทึกสิ่งของ</h2>
          
          <div className="type-selector">
            <button 
              className={`type-btn income ${type === 'receive' ? 'active' : ''}`}
              onClick={() => setType('receive')}
              style={{ color: type === 'receive' ? '#10b981' : undefined }}
            >
              <ArrowDownToLine size={18} /> รับเข้า
            </button>
            <button 
              className={`type-btn expense ${type === 'disburse' ? 'active' : ''}`}
              onClick={() => setType('disburse')}
              style={{ color: type === 'disburse' ? '#f59e0b' : undefined }}
            >
              <ArrowUpFromLine size={18} /> เบิกออกแจกจ่าย
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="modal-form-group" style={{ position: 'relative' }}>
              <label>ชื่อสิ่งของ <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" 
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="เช่น Medkit, Bandage, วิทยุ..."
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
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
                  
                  {/* Show "Add new item" hint if no exact match and user typed something */}
                  {itemName.trim() && !stocks.some(s => s.name.toLowerCase() === itemName.trim().toLowerCase()) && (
                    <div style={{ padding: '0.75rem 1rem', color: '#0ea5e9', fontSize: '0.9rem', fontStyle: 'italic', background: '#f0f9ff' }}>
                      กดบันทึกเพื่อเพิ่ม "{itemName}" เป็นของใหม่ในคลัง
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {type === 'receive' ? (
              <div className="modal-form-group">
                <label>จำนวนที่รับเข้า <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="number" 
                  min="1"
                  value={receiveQuantity}
                  onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                  placeholder="ระบุจำนวน..."
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modal-form-group">
                  <label>แจกจำนวนต่อคน <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" 
                    min="1"
                    value={qtyPerPerson}
                    onChange={(e) => setQtyPerPerson(Number(e.target.value))}
                    placeholder="ชิ้น/คน"
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <div className="modal-form-group">
                  <label>จำนวนคน <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" 
                    min="1"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(Number(e.target.value))}
                    placeholder="กี่คน"
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                {Number(qtyPerPerson) > 0 && Number(peopleCount) > 0 && (
                  <div style={{ gridColumn: 'span 2', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: '#0369a1', border: '1px dashed #bae6fd' }}>
                    รวมของที่ต้องใช้ทั้งหมด: <strong>{(Number(qtyPerPerson) * Number(peopleCount)).toLocaleString()}</strong> ชิ้น
                  </div>
                )}
              </div>
            )}
            
            <div className="modal-form-group">
              <label>รายละเอียดเพิ่มเติม</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุรายละเอียด (ถ้ามี)..."
                rows={2}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={addMutation.isPending}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '8px',
                border: 'none',
                background: type === 'receive' ? '#10b981' : '#f59e0b',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.5rem',
                opacity: addMutation.isPending ? 0.7 : 1
              }}
            >
              {addMutation.isPending ? 'กำลังบันทึก...' : `บันทึก${type === 'receive' ? 'รับเข้าคลัง' : 'เบิกของแจกจ่าย'}`}
            </button>
          </form>
        </div>

        <div className="table-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>สรุปของในคลัง</h2>
            </div>
            {stocks.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>ยังไม่มีรายการสิ่งของในคลัง</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {stocks.map(stock => (
                  <div key={stock.name} style={{
                    padding: '0.5rem 1rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stock.name}</span>
                    <span style={{ color: stock.quantity <= 0 ? '#ef4444' : '#059669', fontWeight: 600 }}>
                      {stock.quantity.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>ประวัติทำรายการ</h2>
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }} className="spinner"></div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                ไม่มีประวัติทำรายการ
              </div>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
                <table className="req-admin-table" style={{ width: '100%', minWidth: '700px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff' }}>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>วันที่/เวลา</th>
                      <th style={{ whiteSpace: 'nowrap' }}>ผู้ทำรายการ</th>
                      <th style={{ whiteSpace: 'nowrap' }}>ประเภท</th>
                      <th style={{ whiteSpace: 'nowrap' }}>สิ่งของ</th>
                      <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>จำนวน</th>
                      <th style={{ whiteSpace: 'nowrap' }}>รายละเอียด</th>
                    </tr>
                  </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                          <Clock size={14} />
                          {new Date(log.created_at).toLocaleString('th-TH')}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.users?.ic_name || 'Unknown'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: log.type === 'receive' ? '#dcfce7' : '#fef3c7',
                          color: log.type === 'receive' ? '#166534' : '#92400e',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {log.type === 'receive' ? 'รับเข้า' : 'เบิกออก'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>{log.item_name}</td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: 600,
                        color: log.type === 'receive' ? '#10b981' : '#f59e0b',
                        whiteSpace: 'nowrap'
                      }}>
                        {log.type === 'receive' ? '+' : '-'}{log.quantity.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{log.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
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
    </div>
  );
}
