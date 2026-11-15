import { useState } from 'react';
import { X, CalendarPlus, Clock } from 'lucide-react';
import SmartDateTimePicker from '../../../components/common/SmartDateTimePicker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const dutySchema = z.object({
  clock_in: z.date({ message: "กรุณาเลือกเวลาเข้างาน" }),
  clock_out: z.date({ message: "กรุณาเลือกเวลาออกงาน" }),
  duty_type: z.string().optional()
}).refine(data => {
  if (!data.clock_in || !data.clock_out) return true;
  return data.clock_out > data.clock_in;
}, {
  message: "เวลาออกงานต้องอยู่หลังเวลาเข้างาน",
  path: ["clock_out"]
});

type DutyFormValues = z.infer<typeof dutySchema>;

export default function AddDutyModal({
  user,
  onClose,
  onSuccess
}: {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<DutyFormValues>({
    resolver: zodResolver(dutySchema),
    defaultValues: {
      clock_in: undefined,
      clock_out: undefined,
      duty_type: 'manual_add'
    }
  });

  const clock_in = watch('clock_in');
  const clock_out = watch('clock_out');

  const calculateDuration = () => {
    if (!clock_in || !clock_out) return null;
    const start = clock_in.getTime();
    const end = clock_out.getTime();
    const diff = end - start;
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  const duration = calculateDuration();

  const onSubmit = async (data: DutyFormValues) => {
    if (!duration || (duration.hours === 0 && duration.minutes === 0)) {
      toast.error('ไม่สามารถเพิ่มเวรที่ไม่มีระยะเวลาทำงานได้');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('duty_logs')
        .insert({
          discord_id: user.discord_id,
          status: 'completed',
          total_break_minutes: 0,
          total_duty_minutes: duration.hours * 60 + duration.minutes,
          clock_in: data.clock_in.toISOString(),
          clock_out: data.clock_out.toISOString(),
          duty_type: data.duty_type || 'manual_add',
          granted_by: currentUser?.discord_id || null
        });

      if (error) throw error;
      
      toast.success('เพิ่มเวรย้อนหลังสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['duty'] });
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      onSuccess();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200/90 animate-in zoom-in-98 duration-150" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600">
              <CalendarPlus size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 m-0">เพิ่มเวรย้อนหลัง</h2>
          </div>
          <button 
            type="button" 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Target Doctor Info */}
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
            <span className="text-slate-500 font-medium">เพิ่มเวลาเวรให้แพทย์:</span>
            <span className="font-bold text-purple-700">{user.ic_name}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทเวร / หมายเหตุ</label>
            <Controller
              name="duty_type"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value || 'manual_add'}
                  onChange={field.onChange}
                  className="w-full px-3 py-2 border border-slate-200/90 rounded-lg text-xs outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 bg-slate-50/60 focus:bg-white text-slate-800 font-medium"
                >
                  <option value="manual_add">เพิ่มเวรย้อนหลัง</option>
                  <option value="mentor">พี่เลี้ยงหมอใหม่ (+1 ชม. + เงิน 500,000)</option>
                  <option value="exam_doctor">สอบหมอใหม่ (+3 ชม.)</option>
                  <option value="queue_manager_bonus">โบนัสรันคิว (+2 ชม.)</option>
                  <option value="normal">เวรปกติ</option>
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">เวลาเข้างาน <span className="text-rose-500">*</span></label>
            <Controller
              name="clock_in"
              control={control}
              render={({ field }) => (
                <SmartDateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  maxDate={clock_out ? new Date(clock_out) : new Date()}
                  placeholder="เลือกเวลาเข้างาน"
                />
              )}
            />
            {errors.clock_in && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.clock_in.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">เวลาออกงาน <span className="text-rose-500">*</span></label>
            <Controller
              name="clock_out"
              control={control}
              render={({ field }) => (
                <SmartDateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  minDate={clock_in ? new Date(clock_in) : undefined}
                  maxDate={new Date()}
                  placeholder="เลือกเวลาออกงาน"
                />
              )}
            />
            {errors.clock_out && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.clock_out.message}</span>}
          </div>

          {duration && (
            <div className="flex items-center justify-center gap-2 bg-emerald-50/90 border border-emerald-200/70 text-emerald-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold">
              <Clock size={15} className="text-emerald-600" />
              <span>รวมระยะเวลา: <strong>{duration.hours} ชม. {duration.minutes} นาที</strong></span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white" 
              onClick={onClose} 
              disabled={isSaving}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-lg border-none bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              disabled={isSaving}
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกเพิ่มเวร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
