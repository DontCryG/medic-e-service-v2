import { useState, useEffect } from 'react';
import { X, ClipboardList } from 'lucide-react';
import SmartSelect from '../../../components/common/SmartSelect';
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import { useCreateLeave } from '../hooks/useLeaveMutations';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
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
  const createLeaveMutation = useCreateLeave();

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
        Swal.fire('ไม่สามารถลางานได้', 'คุณเคยใช้สิทธิ์ลาพักร้อนไปแล้ว (สิทธิ์ 1 ครั้ง/ปี)', 'error');
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

      if (distinctDays.size < 30) {
        Swal.fire('ไม่สามารถลางานได้', `คุณต้องเข้าเวรให้ครบ 30 วันก่อนจึงจะลาพักร้อนได้ (ปัจจุบันเข้าเวรไปแล้ว ${distinctDays.size} วัน)`, 'error');
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
            <ClipboardList size={22} className={
              leaveType === 'vacation' ? 'text-green-500' :
              leaveType === 'resign' ? 'text-red-500' : 'text-[var(--primary)]'
            } />
            ยื่นใบลา
          </h2>
          <button type="button" className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-none bg-transparent" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ประเภทการลา
            </label>
            <Controller
              name="leaveType"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'leave', label: 'ลากิจ' },
                    { value: 'vacation', label: 'ลาพักร้อน' },
                    { value: 'resign', label: 'ลาออก' }
                  ]}
                />
              )}
            />
            {errors.leaveType && <span className="text-red-500 text-sm mt-1 block">{errors.leaveType.message}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                วันที่เริ่มลา
              </label>
              <div className="w-full h-[42px]">
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
              </div>
              {errors.startDate && <span className="text-red-500 text-sm mt-1 block">{errors.startDate.message}</span>}
            </div>
            {leaveType !== 'resign' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  วันที่สิ้นสุด
                </label>
                <div className="w-full h-[42px]">
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
                </div>
                {errors.endDate && <span className="text-red-500 text-sm mt-1 block">{errors.endDate.message}</span>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              เหตุผล
            </label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  placeholder="ระบุเหตุผลการลา..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none"
                />
              )}
            />
            {errors.reason && <span className="text-red-500 text-sm mt-1 block">{errors.reason.message}</span>}
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button 
              type="button" 
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white w-full sm:w-auto" 
              onClick={onClose}
              disabled={isSubmitting || createLeaveMutation.isPending}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className={`px-6 py-2.5 rounded-xl border-none font-semibold text-white transition-all w-full sm:w-auto cursor-pointer ${
                leaveType === 'vacation' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' :
                leaveType === 'resign' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                'bg-[var(--primary)] hover:opacity-90 shadow-sm'
              } shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              disabled={isSubmitting || createLeaveMutation.isPending}
            >
              {(isSubmitting || createLeaveMutation.isPending) ? 'กำลังบันทึก...' : 'ยืนยันการลา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
