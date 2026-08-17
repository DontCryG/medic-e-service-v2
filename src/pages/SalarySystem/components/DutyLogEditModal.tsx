import { useState } from 'react';
import { X, Pencil, Trash2, Save, Clock } from 'lucide-react';
import { useUserDutyLogs } from '../hooks/useSalaryQueries';
import { useUpdateDutyLog, useDeleteDutyLog } from '../hooks/useSalaryMutations';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import SmartDateTimePicker from '../../../components/common/SmartDateTimePicker';

function DateTimeInput({ value, onChange, placeholder }: any) {
  return (
    <SmartDateTimePicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

export default function DutyLogEditModal({ user, startDate, endDate, onClose }: any) {
  const { data: logs, isLoading } = useUserDutyLogs(user.discord_id, startDate, endDate);
  const { mutate: updateLog, isPending: isUpdating } = useUpdateDutyLog();
  const { mutate: deleteLog, isPending: isDeleting } = useDeleteDutyLog();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    clock_in: Date | null;
    clock_out: Date | null;
    total_break_minutes: number;
  }>({
    clock_in: null,
    clock_out: null,
    total_break_minutes: 0
  });

  const handleEditClick = (log: any) => {
    setEditingId(log.id);
    setEditForm({
      clock_in: log.clock_in ? new Date(log.clock_in) : null,
      clock_out: log.clock_out ? new Date(log.clock_out) : null,
      total_break_minutes: Math.floor(log.total_break_minutes || 0)
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ clock_in: null, clock_out: null, total_break_minutes: 0 });
  };

  const handleSaveEdit = (logId: string) => {
    if (editForm.clock_in && editForm.clock_out && editForm.clock_out <= editForm.clock_in) {
      Swal.fire('ข้อผิดพลาด', 'เวลาออกเวรต้องหลังเวลาเข้าเวรเสมอ', 'warning');
      return;
    }
    
    let totalDutyMinutes = 0;
    if (editForm.clock_in && editForm.clock_out) {
      const diffMs = editForm.clock_out.getTime() - editForm.clock_in.getTime();
      const breakMins = parseInt(editForm.total_break_minutes as any) || 0;
      totalDutyMinutes = Math.floor(Math.max(0, (diffMs / 60000) - breakMins));
    }

    if (totalDutyMinutes === 0) {
      toast.error('เวลาเข้าเวรต้องมากกว่า 0 นาที (หากต้องการลบ ให้ใช้ปุ่มลบประวัติแทน)');
      return;
    }

    updateLog({
      id: logId,
      payload: {
        clock_in: editForm.clock_in ? editForm.clock_in.toISOString() : null,
        clock_out: editForm.clock_out ? editForm.clock_out.toISOString() : null,
        total_break_minutes: parseInt(editForm.total_break_minutes as any) || 0,
        total_duty_minutes: totalDutyMinutes
      }
    }, {
      onSuccess: () => {
        setEditingId(null);
      }
    });
  };

  const handleDelete = (logId: string) => {
    Swal.fire({
      title: 'ลบประวัติเวร?',
      text: 'คุณต้องการลบประวัติการเข้าเวรรอบนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบทิ้ง',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteLog(logId);
      }
    });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('th-TH', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '1100px', width: '95%' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pencil size={24} color="#3b82f6" />
            แก้ไขประวัติเวร: {user.ic_name}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
          ) : logs && logs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="salary-table" style={{ fontSize: '0.9rem', width: '100%', minWidth: '950px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>วันที่เข้าเวร (Clock In)</th>
                    <th style={{ width: '35%' }}>เวลาออกเวร (Clock Out)</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>พักเบรก (นาที)</th>
                    <th style={{ width: '180px', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      {editingId === log.id ? (
                        <>
                          <td>
                            <DateTimeInput 
                              value={editForm.clock_in}
                              onChange={(date: any) => setEditForm({...editForm, clock_in: date})}
                              placeholder="เวลาเข้าเวร"
                            />
                          </td>
                          <td>
                            <DateTimeInput 
                              value={editForm.clock_out}
                              onChange={(date: any) => setEditForm({...editForm, clock_out: date})}
                              placeholder="เวลาออกเวร"
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              value={editForm.total_break_minutes} 
                              onChange={(e) => setEditForm({...editForm, total_break_minutes: e.target.value as any})}
                              className="modal-input"
                              style={{ width: '100px', textAlign: 'center', padding: '0.5rem', borderRadius: '8px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleSaveEdit(log.id)}
                                disabled={isUpdating}
                                style={{
                                  background: '#10b981', color: 'white', border: 'none',
                                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Save size={16} /> บันทึก
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                                style={{
                                  background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1',
                                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'
                                }}
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ color: log.clock_in ? '#1e293b' : '#ef4444' }}>{formatDate(log.clock_in)}</td>
                          <td style={{ color: log.clock_out ? '#1e293b' : '#ef4444' }}>
                            {formatDate(log.clock_out)}
                            {!log.clock_out && <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: '#ef4444' }}>(ยังไม่ออกเวร)</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{Math.floor(log.total_break_minutes || 0)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleEditClick(log)}
                                style={{
                                  background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe',
                                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Pencil size={16} /> แก้ไข
                              </button>
                              <button 
                                onClick={() => handleDelete(log.id)}
                                disabled={isDeleting}
                                style={{
                                  background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <Trash2 size={16} /> ลบ
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <Clock size={32} />
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#475569', fontSize: '1.1rem' }}>ไม่มีประวัติการเข้าเวร</p>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>ไม่พบข้อมูลประวัติเวรในช่วงเวลาที่เลือก</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
