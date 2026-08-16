import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Clock, ArrowDown, ArrowUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useFinanceLogs } from '../hooks/useAccountingQueries';
import { useAddFinanceLog } from '../hooks/useAccountingMutations';

import CustomDatePicker from '@/components/common/CustomDatePicker';
import FinanceReportModal from './FinanceReportModal';
import EditFinanceLogModal from './EditFinanceLogModal';
import Swal from 'sweetalert2';
import { useDeleteFinanceLog } from '../hooks/useAccountingMutations';
import { Edit2, Trash2 } from 'lucide-react';

export default function FinanceTab() {
  const { user } = useAuthStore();
  const { data: logs = [], isLoading } = useFinanceLogs();
  const addMutation = useAddFinanceLog();

  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const deleteMutation = useDeleteFinanceLog();
  
  // Date Range Filter States
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day + 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Filter logs by date range
  const filteredLogs = logs.filter(log => {
    if (!startDate && !endDate) return true;
    const logDate = new Date(log.created_at);
    // Reset time for comparison
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

  const totalIncome = filteredLogs.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredLogs.filter(l => l.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const globalIncome = logs.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const globalExpense = logs.filter(l => l.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const globalBalance = globalIncome - globalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.discord_id || amount === '' || Number(amount) <= 0) return;

    if (type === 'expense' && Number(amount) > globalBalance) {
      Swal.fire({
        icon: 'error',
        title: 'ยอดเงินคงเหลือไม่เพียงพอ!',
        text: `คุณต้องการเบิกรายจ่าย ฿ ${Number(amount).toLocaleString()} แต่มีเงินคงเหลือในระบบเพียง ฿ ${globalBalance.toLocaleString()}`
      });
      return;
    }

    addMutation.mutate({
      discord_id: user.discord_id,
      type,
      amount: Number(amount),
      description
    }, {
      onSuccess: () => {
        setAmount('');
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
        
        {/* Income Card */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#10b981', padding: '0.5rem 1rem', color: 'white' }}>
            <TrendingUp size={24} />
          </div>
          <div style={{ background: '#d1fae5', padding: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>รายรับรวม</h3>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#047857', marginTop: '0.25rem' }}>฿ {totalIncome.toLocaleString()}</p>
          </div>
        </div>

        {/* Expense Card */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#ef4444', padding: '0.5rem 1rem', color: 'white' }}>
            <TrendingDown size={24} />
          </div>
          <div style={{ background: '#fee2e2', padding: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>รายจ่ายรวม</h3>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#b91c1c', marginTop: '0.25rem' }}>฿ {totalExpense.toLocaleString()}</p>
          </div>
        </div>

        {/* Balance Card */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#0ea5e9', padding: '0.5rem 1rem', color: 'white' }}>
            <Wallet size={24} />
          </div>
          <div style={{ background: '#e0f2fe', padding: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>คงเหลือ</h3>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#0369a1', marginTop: '0.25rem' }}>฿ {balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="content-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="form-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>บันทึกรายรับ-รายจ่าย</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`modal-btn ${type === 'income' ? 'save' : 'cancel'}`}
                style={{ 
                  background: type === 'income' ? '#ecfdf5' : 'transparent',
                  color: type === 'income' ? '#059669' : '#64748b',
                  borderColor: type === 'income' ? '#34d399' : '#e2e8f0',
                  border: '1px solid',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ArrowDown size={18} /> รายรับ
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`modal-btn ${type === 'expense' ? 'cancel' : 'save'}`}
                style={{ 
                  background: type === 'expense' ? '#fef2f2' : 'transparent',
                  color: type === 'expense' ? '#dc2626' : '#64748b',
                  borderColor: type === 'expense' ? '#f87171' : '#e2e8f0',
                  border: '1px solid',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ArrowUp size={18} /> รายจ่าย
              </button>
            </div>

            <div className="modal-form-group">
              <label>จำนวนเงิน (บาท) <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="number" 
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="ระบุจำนวนเงิน..."
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            
            <div className="modal-form-group">
              <label>รายละเอียด</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุรายละเอียด (ถ้ามี)..."
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={addMutation.isPending || amount === '' || amount <= 0}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '8px',
                border: 'none',
                background: type === 'income' ? '#10b981' : '#ef4444',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.5rem',
                opacity: (addMutation.isPending || amount === '' || amount <= 0) ? 0.7 : 1
              }}
            >
              {addMutation.isPending ? 'กำลังบันทึก...' : `บันทึก${type === 'income' ? 'รายรับ' : 'รายจ่าย'}`}
            </button>
          </form>
        </div>

        <div className="table-card" style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>ประวัติทำรายการ</h2>
          
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }} className="spinner"></div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
              ไม่มีประวัติทำรายการ
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
              <table className="req-admin-table" style={{ width: '100%', minWidth: '700px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff' }}>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>วันที่/เวลา</th>
                    <th style={{ whiteSpace: 'nowrap' }}>ผู้บันทึก</th>
                    <th style={{ whiteSpace: 'nowrap' }}>ประเภท</th>
                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>จำนวนเงิน (฿)</th>
                    <th style={{ whiteSpace: 'nowrap' }}>รายละเอียด</th>
                    {user?.role === 'admin' && <th style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>จัดการ</th>}
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
                        background: log.type === 'income' ? '#dcfce7' : '#fee2e2',
                        color: log.type === 'income' ? '#166534' : '#991b1b',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}>
                        {log.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: log.type === 'income' ? '#10b981' : '#ef4444',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.type === 'income' ? '+' : '-'}{log.amount.toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{log.description || '-'}</td>
                    {user?.role === 'admin' && (
                        <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <button
                            onClick={() => setEditingLog(log)}
                            style={{
                              background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', marginRight: '8px'
                            }}
                            title="แก้ไข"
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
                                confirmButtonText: 'ลบข้อมูล',
                                cancelButtonText: 'ยกเลิก'
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  deleteMutation.mutate(log.id);
                                }
                              });
                            }}
                            style={{
                              background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px'
                            }}
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            )}
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
