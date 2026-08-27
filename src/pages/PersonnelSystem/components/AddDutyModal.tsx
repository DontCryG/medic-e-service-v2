import { useState } from 'react';
import { X } from 'lucide-react';
import SmartDateTimePicker from '../../../components/common/SmartDateTimePicker';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const dutySchema = z.object({
  clock_in: z.date({ message: "กรุณาเลือกเวลาเข้างาน" }),
  clock_out: z.date({ message: "กรุณาเลือกเวลาออกงาน" })
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
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<DutyFormValues>({
    resolver: zodResolver(dutySchema),
    defaultValues: {
      clock_in: undefined,
      clock_out: undefined
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
        });

      if (error) throw error;
      
      toast.success('เพิ่มเวรย้อนหลังสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['duty_logs'] });
      onSuccess();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
      <div className="bg-[var(--surface-color)] rounded-[20px] p-6 sm:p-10 w-full max-w-[500px] shadow-xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 m-0">เพิ่มเวรย้อนหลัง</h2>
          <button 
            className="bg-transparent border-none text-slate-500 cursor-pointer p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-center" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6 p-4 bg-slate-50 rounded-xl text-slate-700">
          กำลังเพิ่มเวรให้: <strong className="text-[var(--primary)] text-lg block mt-1">{user.ic_name}</strong>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <label className="block font-semibold text-slate-700 mb-2">เวลาเข้างาน</label>
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
            {errors.clock_in && <span className="text-red-500 text-sm mt-1 block">{errors.clock_in.message}</span>}
          </div>

          <div className="mb-5">
            <label className="block font-semibold text-slate-700 mb-2">เวลาออกงาน</label>
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
            {errors.clock_out && <span className="text-red-500 text-sm mt-1 block">{errors.clock_out.message}</span>}
          </div>

          {duration && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center mb-6">
              <strong>รวมเวลา:</strong> {duration.hours} ชั่วโมง {duration.minutes} นาที
            </div>
          )}

          <div className="flex justify-end gap-4 mt-8 sticky -bottom-10 bg-[var(--surface-color)] pt-6 pb-10 -mb-10 border-t border-slate-200 z-10">
            <button type="button" className="px-6 py-3 rounded-[8px] font-semibold text-base cursor-pointer border-none transition-all bg-slate-100 text-slate-600 hover:bg-slate-200" onClick={onClose} disabled={isSaving}>ยกเลิก</button>
            <button type="submit" className="px-6 py-3 rounded-[8px] font-semibold text-base cursor-pointer border-none transition-all bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'เพิ่มเวรย้อนหลัง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
