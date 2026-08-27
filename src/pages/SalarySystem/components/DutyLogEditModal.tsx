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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
            <Pencil size={24} className="text-[var(--primary)]" />
            แก้ไขประวัติเวร: {user.ic_name}
          </h2>
          <button className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-none bg-transparent" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
          ) : logs && logs.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full text-left border-collapse min-w-[950px] text-sm">
                <thead>
                  <tr>
                    <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 w-[35%]">วันที่เข้าเวร (Clock In)</th>
                    <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 w-[35%]">เวลาออกเวร (Clock Out)</th>
                    <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 w-[100px] text-center">พักเบรก (นาที)</th>
                    <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 w-[180px] text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      {editingId === log.id ? (
                        <>
                          <td className="p-2 border-b border-slate-50">
                            <DateTimeInput 
                              value={editForm.clock_in}
                              onChange={(date: any) => setEditForm({...editForm, clock_in: date})}
                              placeholder="เวลาเข้าเวร"
                            />
                          </td>
                          <td className="p-2 border-b border-slate-50">
                            <DateTimeInput 
                              value={editForm.clock_out}
                              onChange={(date: any) => setEditForm({...editForm, clock_out: date})}
                              placeholder="เวลาออกเวร"
                            />
                          </td>
                          <td className="p-2 border-b border-slate-50">
                            <input 
                              type="number" 
                              value={editForm.total_break_minutes} 
                              onChange={(e) => setEditForm({...editForm, total_break_minutes: e.target.value as any})}
                              className="w-[100px] text-center border border-slate-200 rounded-lg p-2 outline-none focus:border-[var(--primary)] mx-auto block"
                            />
                          </td>
                          <td className="p-2 border-b border-slate-50 text-center">
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => handleSaveEdit(log.id)}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 bg-green-500 text-white hover:bg-green-600 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <Save size={14} /> บันทึก
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <X size={14} /> ยกเลิก
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 border-b border-slate-50 text-slate-700">{formatDate(log.clock_in)}</td>
                          <td className="p-4 border-b border-slate-50 text-slate-700">
                            {formatDate(log.clock_out)}
                            {!log.clock_out && <span className="text-xs ml-2 text-red-500">(ยังไม่ออกเวร)</span>}
                          </td>
                          <td className="p-4 border-b border-slate-50 text-center text-slate-700">{Math.floor(log.total_break_minutes || 0)}</td>
                          <td className="p-4 border-b border-slate-50">
                            <div className="flex gap-2 justify-center">
                              <button 
                                onClick={() => handleEditClick(log)}
                                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors text-sm font-medium"
                              >
                                <Pencil size={14} /> แก้ไข
                              </button>
                              <button 
                                onClick={() => handleDelete(log.id)}
                                disabled={isDeleting}
                                className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <Trash2 size={14} /> ลบ
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
