import { useState, useEffect } from 'react';
import { X, ClipboardList, CalendarDays, Clock, AlertTriangle } from 'lucide-react';
import SmartSelect from '../../../components/common/SmartSelect';
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import { useCreateLeave } from '../hooks/useLeaveMutations';
import { useAppConfig } from '@/hooks/useAppConfig';
import { supabase } from '@/lib/supabase';
import { showErrorAlert } from '@/utils/alert';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const leaveSchema = z.object({
  leaveType: z.enum(['leave', 'vacation', 'resign']),
  startDate: z.date({ message: 'กรุณาเลือกวันที่เริ่มต้น' }),
  endDate: z.date().optional().nullable(),
  reason: z.string().min(1, 'กรุณาระบุเหตุผล')
}).refine(data => {
  if (data.leaveType !== 'resign') {
    return !!data.endDate;
  }
  return true;
}, {
  message: 'กรุณาเลือกวันที่สิ้นสุด',
  path: ['endDate']
}).refine(data => {
  if (data.leaveType !== 'resign' && data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    start.setHours(0,0,0,0);
    const end = new Date(data.endDate);
    end.setHours(0,0,0,0);
    return end >= start;
  }
  return true;
}, {
  message: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น',
  path: ['endDate']
});

type LeaveFormValues = z.infer<typeof leaveSchema>;

interface LeaveRequestModalProps {
  onClose: () => void;
  profile: any;
}

export default function LeaveRequestModal({ onClose, profile }: LeaveRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dutyDaysCount, setDutyDaysCount] = useState<number | null>(null);
  const [hasUsedVacation, setHasUsedVacation] = useState<boolean | null>(null);
  const createLeaveMutation = useCreateLeave();
  const { config } = useAppConfig();
  const vacationMinDays = config.vacation_min_duty_days || 30;

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveType: 'leave',
      startDate: new Date(),
      endDate: new Date(),
      reason: ''
    }
  });

  const leaveType = watch('leaveType');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    if (!profile?.discord_id) return;
    
    // Check vacation usage
    supabase
      .from('leave_requests')
      .select('id')
      .eq('discord_id', profile.discord_id)
      .eq('leave_type', 'vacation')
      .in('status', ['pending', 'approved'])
      .then(({ data }) => {
        setHasUsedVacation(!!(data && data.length > 0));
      });

    // Check duty days
    supabase
      .from('duty_logs')
      .select('clock_in')
      .eq('discord_id', profile.discord_id)
      .eq('status', 'completed')
      .then(({ data }) => {
        if (data) {
          const days = new Set(data.map(log => {
            const d = new Date(log.clock_in);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          }));
          setDutyDaysCount(days.size);
        } else {
          setDutyDaysCount(0);
        }
      });
  }, [profile?.discord_id]);

  useEffect(() => {
    if (startDate && endDate && leaveType !== 'resign') {
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const end = new Date(endDate);
      end.setHours(0,0,0,0);
      if (start > end) {
        setValue('endDate', startDate, { shouldValidate: true });
      }
    }
  }, [startDate, leaveType, setValue]); 

  const calculateTotalDays = (start: Date | null | undefined, end: Date | null | undefined) => {
    if (!start) return 0;
    if (!end) return 1;
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDateDisplay = (date: Date | null | undefined) => {
    if (!date) return '-';
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const onSubmit = async (data: LeaveFormValues) => {
    if (!profile?.discord_id) return;
    
    const finalEndDate = data.leaveType === 'resign' ? data.startDate : (data.endDate as Date);
    
    if (data.leaveType === 'vacation') {
      const { data: pastVacations } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('discord_id', profile.discord_id)
        .eq('leave_type', 'vacation')
        .in('status', ['pending', 'approved']);
      
      if (pastVacations && pastVacations.length > 0) {
        showErrorAlert('ไม่สามารถลางานได้', 'คุณเคยใช้สิทธิ์ลาพักร้อนไปแล้ว (สิทธิ์ 1 ครั้ง/ปี)');
        return;
      }

      const { data: dutyLogs } = await supabase
        .from('duty_logs')
        .select('clock_in')
        .eq('discord_id', profile.discord_id)
        .eq('status', 'completed');
      
      const distinctDays = new Set((dutyLogs || []).map(log => {
        const d = new Date(log.clock_in);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }));

      if (distinctDays.size < vacationMinDays) {
        showErrorAlert('ไม่สามารถลางานได้', `คุณต้องเข้าเวรให้ครบ ${vacationMinDays} วันก่อนจึงจะลาพักร้อนได้ (ปัจจุบันเข้าเวรไปแล้ว ${distinctDays.size} วัน)`);
        return;
      }
    }

    setIsSubmitting(true);
    createLeaveMutation.mutate({
      discord_id: profile.discord_id,
      leave_type: data.leaveType,
      start_date: data.startDate.toISOString().split('T')[0],
      end_date: finalEndDate.toISOString().split('T')[0],
      reason: data.reason
    }, {
      onSuccess: () => {
        setIsSubmitting(false);
        onClose();
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-[430px] shadow-xl overflow-hidden border border-slate-200/90 animate-in zoom-in-98 duration-150" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              leaveType === 'vacation' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' :
              leaveType === 'resign' ? 'bg-rose-50 text-rose-600 border-rose-200/60' : 
              'bg-purple-50 text-[#7e22ce] border-purple-200/60'
            }`}>
              <ClipboardList size={15} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 m-0">
              ยื่นใบคำร้องการลา
            </h2>
          </div>
          <button 
            type="button" 
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border-none bg-transparent" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-3.5">
          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ประเภทการลา <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="leaveType"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'leave', label: 'ลากิจ (Leave)' },
                    { value: 'vacation', label: 'ลาพักร้อน (Vacation)' },
                    { value: 'resign', label: 'ลาออก (Resign)' }
                  ]}
                />
              )}
            />
            {errors.leaveType && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.leaveType.message}</span>}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {leaveType === 'resign' ? 'วันที่มีผลลาออก' : 'วันที่เริ่มลา'} <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <SmartDatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    placeholderText="เลือกวันที่เริ่มลา"
                  />
                )}
              />
              {errors.startDate && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.startDate.message}</span>}
            </div>

            {leaveType !== 'resign' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่สิ้นสุด <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <SmartDatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      minDate={startDate || undefined}
                      placeholderText="เลือกวันที่สิ้นสุด"
                    />
                  )}
                />
                {errors.endDate && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.endDate.message}</span>}
              </div>
            )}
          </div>

          {/* Dynamic Information & Rules Banner */}
          {leaveType === 'vacation' && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-lg text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-emerald-600" />
                  สรุปวันลาพักร้อน:
                </span>
                <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs font-mono">
                  รวม {calculateTotalDays(startDate, endDate)} วัน
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 space-y-1 pt-1.5 border-t border-emerald-200/60">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">• สิทธิ์การลาประจำปี:</span>
                  <span>
                    {hasUsedVacation === null ? (
                      <span className="text-slate-400">กำลังตรวจสอบ...</span>
                    ) : hasUsedVacation ? (
                      <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60">ใช้สิทธิ์ไปแล้ว (1 ครั้ง/ปี)</span>
                    ) : (
                      <span className="text-emerald-700 font-bold bg-white px-1.5 py-0.2 rounded border border-emerald-200/60">ยังไม่เคยใช้สิทธิ์ (มีสิทธิ์ลาได้)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">• ประวัติเข้าเวรสะสม:</span>
                  <span>
                    {dutyDaysCount === null ? (
                      <span className="text-slate-400">กำลังตรวจสอบ...</span>
                    ) : (
                      <span className="font-bold">
                        <strong className={dutyDaysCount >= vacationMinDays ? 'text-emerald-700' : 'text-amber-700'}>
                          {dutyDaysCount}
                        </strong> / {vacationMinDays} วัน {dutyDaysCount >= vacationMinDays ? (
                          <span className="text-emerald-600 font-bold">(ครบเกณฑ์)</span>
                        ) : (
                          <span className="text-amber-600 font-bold">(ยังไม่ครบ {vacationMinDays} วัน)</span>
                        )}
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 m-0 pt-0.5 leading-tight">
                  * หมายเหตุ: {config.vacation_notice_detail || `ต้องเข้าเวรสะสมครบ ${vacationMinDays} วันขึ้นไป ได้รับค่าตอบแทนเวรปกติเมื่อได้รับการอนุมัติ`}
                </p>
              </div>
            </div>
          )}

          {leaveType === 'leave' && (
            <div className="p-3 bg-purple-50/60 border border-purple-200/70 rounded-lg text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-[#7e22ce]" />
                  สรุปวันลากิจ:
                </span>
                <span className="font-bold text-[#7e22ce] bg-white px-2 py-0.5 rounded border border-purple-200 shadow-2xs font-mono">
                  รวม {calculateTotalDays(startDate, endDate)} วัน
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1.5 border-t border-purple-200/50 leading-relaxed">
                <div>• ช่วงเวลา: <strong>{formatDateDisplay(startDate)}</strong> ถึง <strong>{formatDateDisplay(endDate)}</strong></div>
                <div>• {config.leave_notice_detail || 'สำหรับลากิจส่วนตัวหรือมีธุระจำเป็น กรุณาระบุเหตุผลอย่างชัดเจนเพื่อให้ผู้บริหารพิจารณาอนุมัติ'}</div>
              </div>
            </div>
          )}

          {leaveType === 'resign' && (
            <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-lg text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600" />
                  ข้อควรทราบการลาออก:
                </span>
                <span className="font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
                  มีผล {formatDateDisplay(startDate)}
                </span>
              </div>
              <div className="text-[11px] text-rose-800 space-y-0.5 pt-1.5 border-t border-rose-200/60 leading-relaxed">
                <div>• {config.resign_notice_detail || 'การยื่นคำร้องนี้เป็นการแจ้งความประสงค์ขอพ้นสภาพบุคลากรทางการแพทย์ และเมื่อได้รับการอนุมัติ สถานะจะถูกปรับเป็น "Resigned" และถูกตัดสิทธิ์การเข้าใช้งานระบบทันที'}</div>
              </div>
            </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เหตุผลการลา <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  placeholder={
                    leaveType === 'resign' 
                      ? 'ระบุเหตุผลความจำเป็นในการลาออก...' 
                      : leaveType === 'vacation' 
                      ? 'ระบุรายละเอียดการลาพักร้อน...' 
                      : 'ระบุเหตุผลการลาอย่างชัดเจน...'
                  }
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200/90 bg-slate-50/50 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-[#7e22ce] transition-all resize-none font-medium"
                />
              )}
            />
            {errors.reason && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.reason.message}</span>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-1">
            <button 
              type="button" 
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white" 
              onClick={onClose}
              disabled={isSubmitting || createLeaveMutation.isPending}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className={`px-4 py-1.5 rounded-lg border-none text-xs font-semibold text-white transition-all cursor-pointer shadow-2xs ${
                leaveType === 'vacation' ? 'bg-emerald-600 hover:bg-emerald-700' :
                leaveType === 'resign' ? 'bg-rose-600 hover:bg-rose-700' :
                'bg-[#7e22ce] hover:bg-[#6b21a8]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isSubmitting || createLeaveMutation.isPending}
            >
              {(isSubmitting || createLeaveMutation.isPending) ? 'กำลังบันทึก...' : 'ยืนยันการส่งใบลา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
