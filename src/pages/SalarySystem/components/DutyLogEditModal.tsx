import { useState } from 'react';
import { X, Pencil, Trash2, Save } from 'lucide-react';
import { useUserDutyLogs } from '../hooks/useSalaryQueries';
import { useUpdateDutyLog, useDeleteDutyLog } from '../hooks/useSalaryMutations';
import { showConfirmDialog, showErrorAlert } from '@/utils/alert';
import toast from 'react-hot-toast';
import SmartDateTimePicker from '../../../components/common/SmartDateTimePicker';
import TableSkeleton from '@/components/common/TableSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { getDutyBadgeInfo } from '@/pages/DutySystem/utils/dutyUtils';

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
    duty_type: string;
    custom_type: string;
  }>({
    clock_in: null,
    clock_out: null,
    total_break_minutes: 0,
    duty_type: 'normal',
    custom_type: ''
  });

  const handleEditClick = (log: any) => {
    setEditingId(log.id);
    const inTime = log.clock_in ? new Date(log.clock_in) : null;
    let outTime = log.clock_out ? new Date(log.clock_out) : null;
    if (inTime && outTime && outTime <= inTime && (log.total_duty_minutes || 0) > 0) {
      outTime = new Date(inTime.getTime() + log.total_duty_minutes * 60000);
    }

    const currentType = log.duty_type || 'normal';
    const isStandard = ['normal', 'queue_manager_bonus', 'exam_doctor', 'mentor', 'manual_add'].includes(currentType);

    setEditForm({
      clock_in: inTime,
      clock_out: outTime,
      total_break_minutes: Math.floor(log.total_break_minutes || 0),
      duty_type: isStandard ? currentType : 'custom',
      custom_type: isStandard ? '' : currentType
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      clock_in: null,
      clock_out: null,
      total_break_minutes: 0,
      duty_type: 'normal',
      custom_type: ''
    });
  };

  const handleSaveEdit = (logId: string) => {
    if (editForm.clock_in && editForm.clock_out && editForm.clock_out <= editForm.clock_in) {
      showErrorAlert('ข้อผิดพลาด', 'เวลาออกเวรต้องอยู่หลังเวลาเข้าเวรเสมอ');
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

    let finalDutyType = editForm.duty_type;
    if (editForm.duty_type === 'custom') {
      finalDutyType = editForm.custom_type.trim() || 'เวรพิเศษ';
    }

    updateLog({
      id: logId,
      payload: {
        clock_in: editForm.clock_in ? editForm.clock_in.toISOString() : null,
        clock_out: editForm.clock_out ? editForm.clock_out.toISOString() : null,
        total_break_minutes: parseInt(editForm.total_break_minutes as any) || 0,
        total_duty_minutes: totalDutyMinutes,
        duty_type: finalDutyType || 'normal'
      }
    }, {
      onSuccess: () => {
        setEditingId(null);
      }
    });
  };

  const handleDelete = async (logId: string) => {
    const result = await showConfirmDialog({
      title: 'ลบประวัติเวร?',
      text: 'คุณต้องการลบประวัติการเข้าเวรรอบนี้ใช่หรือไม่? ข้อมูลนี้ไม่สามารถกู้คืนได้',
      icon: 'warning',
      confirmButtonText: 'ลบทิ้ง',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      deleteLog(logId);
    }
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
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
            <Pencil size={22} className="text-purple-600" />
            แก้ไขประวัติเวร: {user.ic_name}
          </h2>
          <button className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-none bg-transparent" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse min-w-[950px] text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="p-4 text-slate-600 font-bold border-b border-slate-100 w-[24%]">วันที่เข้าเวร (Clock In)</th>
                    <th className="p-4 text-slate-600 font-bold border-b border-slate-100 w-[24%]">เวลาออกเวร (Clock Out)</th>
                    <th className="p-4 text-slate-600 font-bold border-b border-slate-100 w-[90px] text-center">พัก (นาที)</th>
                    <th className="p-4 text-slate-600 font-bold border-b border-slate-100 text-center">ประเภท / ที่มา</th>
                    <th className="p-4 text-slate-600 font-bold border-b border-slate-100 w-[170px] text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => {
                    const badge = getDutyBadgeInfo(log.duty_type, log.granted_by);
                    const isEditing = editingId === log.id;
                    return (
                      <tr key={log.id} className={isEditing ? 'bg-purple-50/30' : 'hover:bg-slate-50/60 transition-colors'}>
                        {isEditing ? (
                          <>
                            <td className="p-3">
                              <DateTimeInput 
                                value={editForm.clock_in}
                                onChange={(date: any) => setEditForm({...editForm, clock_in: date})}
                                placeholder="เวลาเข้าเวร"
                              />
                            </td>
                            <td className="p-3">
                              <DateTimeInput 
                                value={editForm.clock_out}
                                onChange={(date: any) => setEditForm({...editForm, clock_out: date})}
                                placeholder="เวลาออกเวร"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="number" 
                                min={0}
                                value={editForm.total_break_minutes} 
                                onChange={(e) => setEditForm({...editForm, total_break_minutes: e.target.value as any})}
                                className="w-[75px] text-center border border-slate-200 rounded-lg p-2 outline-none focus:border-purple-500 mx-auto block bg-white"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col gap-1.5 items-center">
                                <select
                                  value={editForm.duty_type}
                                  onChange={(e) => setEditForm({...editForm, duty_type: e.target.value})}
                                  className="w-full max-w-[200px] px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-purple-500 font-medium"
                                >
                                  <option value="normal">เวรปกติ</option>
                                  <option value="queue_manager_bonus">โบนัสรันคิว (+2 ชม.)</option>
                                  <option value="mentor">พี่เลี้ยงหมอใหม่ (+1 ชม. + เงิน 500,000)</option>
                                  <option value="exam_doctor">สอบหมอใหม่ (+3 ชม.)</option>
                                  <option value="manual_add">เพิ่มเวรย้อนหลัง</option>
                                  <option value="custom">เวรพิเศษ / กำหนดเอง</option>
                                </select>
                                {editForm.duty_type === 'custom' && (
                                  <input
                                    type="text"
                                    value={editForm.custom_type}
                                    onChange={(e) => setEditForm({...editForm, custom_type: e.target.value})}
                                    placeholder="ระบุชื่อประเภทเวร"
                                    className="w-full max-w-[200px] px-2.5 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-500 bg-white"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => handleSaveEdit(log.id)}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors text-xs font-semibold disabled:opacity-50 shadow-sm"
                                >
                                  <Save size={13} /> บันทึก
                                </button>
                                <button 
                                  onClick={handleCancelEdit}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors text-xs font-semibold disabled:opacity-50"
                                >
                                  <X size={13} /> ยกเลิก
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 text-slate-700 font-medium">{formatDate(log.clock_in)}</td>
                            <td className="p-4 text-slate-700 font-medium">
                              {formatDate(log.clock_out)}
                              {!log.clock_out && <span className="text-xs ml-2 font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">(กำลังเข้าเวร)</span>}
                            </td>
                            <td className="p-4 text-center text-slate-600 font-medium">{Math.floor(log.total_break_minutes || 0)}</td>
                            <td className="p-4 text-center whitespace-nowrap">
                              {badge ? (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                                  {badge.label}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">เวรปกติ</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => handleEditClick(log)}
                                  className="flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 cursor-pointer transition-colors text-xs font-semibold"
                                >
                                  <Pencil size={13} /> แก้ไข
                                </button>
                                <button 
                                  onClick={() => handleDelete(log.id)}
                                  disabled={isDeleting}
                                  className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer transition-colors text-xs font-semibold disabled:opacity-50"
                                >
                                  <Trash2 size={13} /> ลบ
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="ไม่มีประวัติการเข้าเวร"
              description="ไม่พบข้อมูลประวัติเวรของแพทย์ท่านนี้ในช่วงเวลาที่เลือก"
            />
          )}
        </div>
      </div>
    </div>
  );
}
