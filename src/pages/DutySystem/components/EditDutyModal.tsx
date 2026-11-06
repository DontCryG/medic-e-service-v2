import { useState } from 'react';
import { X, Save, Pencil } from 'lucide-react';
import SmartDateTimePicker from '../../../components/common/SmartDateTimePicker';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

interface EditDutyModalProps {
  log: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditDutyModal({ log, onClose, onSuccess }: EditDutyModalProps) {
  const queryClient = useQueryClient();
  const [clockIn, setClockIn] = useState<Date | null>(log.clock_in ? new Date(log.clock_in) : null);
  const [clockOut, setClockOut] = useState<Date | null>(log.clock_out ? new Date(log.clock_out) : null);
  const [breakMinutes, setBreakMinutes] = useState<number>(Math.floor(log.total_break_minutes || 0));
  const [dutyType, setDutyType] = useState<string>(log.duty_type || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockIn || !clockOut) {
      toast.error('กรุณาระบุเวลาเข้าเวรและออกเวร');
      return;
    }

    if (clockOut <= clockIn) {
      Swal.fire('ข้อผิดพลาด', 'เวลาออกเวรต้องอยู่หลังเวลาเข้าเวรเสมอ', 'warning');
      return;
    }

    const diffMs = clockOut.getTime() - clockIn.getTime();
    const breakMins = parseInt(breakMinutes as any) || 0;
    const totalDutyMinutes = Math.floor(Math.max(0, (diffMs / 60000) - breakMins));

    if (totalDutyMinutes === 0) {
      toast.error('เวลาเข้าเวรต้องมากกว่า 0 นาที (หากต้องการลบ ให้ใช้ปุ่มลบแทน)');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('duty_logs')
        .update({
          clock_in: clockIn.toISOString(),
          clock_out: clockOut.toISOString(),
          total_break_minutes: breakMins,
          total_duty_minutes: totalDutyMinutes,
          duty_type: dutyType.trim() ? dutyType.trim() : null
        })
        .eq('id', log.id);

      if (error) throw error;

      toast.success('แก้ไขประวัติเวรสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['duty'] });
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
            <Pencil size={20} className="text-purple-600" />
            แก้ไขประวัติเวร {log.users?.ic_name ? `(${log.users.ic_name})` : ''}
          </h2>
          <button 
            type="button" 
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-none bg-transparent" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">เวลาเข้าเวร (Clock In)</label>
            <SmartDateTimePicker
              value={clockIn}
              onChange={(date: Date | null) => setClockIn(date)}
              placeholder="เลือกเวลาเข้าเวร"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">เวลาออกเวร (Clock Out)</label>
            <SmartDateTimePicker
              value={clockOut}
              onChange={(date: Date | null) => setClockOut(date)}
              placeholder="เลือกเวลาออกเวร"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">พักเบรก (นาที)</label>
            <input
              type="number"
              min={0}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ประเภทเวร / ที่มาเวลาพิเศษ</label>
            <select
              value={['normal', 'queue_manager_bonus', 'exam_doctor', 'mentor', 'manual_add', ''].includes(dutyType) ? (dutyType || 'normal') : 'custom'}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setDutyType('เวรพิเศษ');
                } else {
                  setDutyType(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500 bg-white mb-2"
            >
              <option value="normal">เวรปกติ</option>
              <option value="queue_manager_bonus">โบนัสรันคิว (+2 ชม.)</option>
              <option value="exam_doctor">สอบหมอใหม่ (+3 ชม.)</option>
              <option value="mentor">พี่เลี้ยงหมอใหม่ (+1 ชม.)</option>
              <option value="manual_add">เพิ่มเวรย้อนหลัง</option>
              <option value="custom">อื่นๆ (ระบุเอง)</option>
            </select>

            {!['normal', 'queue_manager_bonus', 'exam_doctor', 'mentor', 'manual_add'].includes(dutyType) && (
              <input
                type="text"
                value={dutyType}
                onChange={(e) => setDutyType(e.target.value)}
                placeholder="ระบุประเภทเวรหรือเหตุผล"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500"
              />
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              onClick={onClose}
              disabled={isSaving}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              disabled={isSaving}
            >
              <Save size={16} />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
