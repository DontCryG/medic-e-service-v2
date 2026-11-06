import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import Swal from 'sweetalert2';
import { X, Award } from 'lucide-react';
import SmartSelect from '../../../components/common/SmartSelect';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';

const specialDutySchema = z.object({
  selectedUserId: z.string().min(1, 'กรุณาเลือกหมอ'),
  dutyType: z.enum(['exam_doctor', 'mentor', 'queue_manager_bonus', 'custom']),
  customReason: z.string().optional(),
  customMinutes: z.number().min(1, 'ต้องมากกว่า 0 นาที').optional()
});

type SpecialDutyFormValues = z.infer<typeof specialDutySchema>;

interface SpecialDutyModalProps {
  onClose: () => void;
}

export default function SpecialDutyModal({ onClose }: SpecialDutyModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, register, formState: { errors } } = useForm<SpecialDutyFormValues>({
    resolver: zodResolver(specialDutySchema),
    defaultValues: {
      selectedUserId: '',
      dutyType: 'exam_doctor'
    }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('discord_id, ic_name')
      .neq('role', 'user')
      .neq('role', 'resigned')
      .order('ic_name');
    if (data) setUsers(data);
  };

  const onSubmit = async (data: SpecialDutyFormValues) => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      let totalMinutes = 60;
      let dutyTypeValue: string = data.dutyType;
      let typeName = '';

      if (data.dutyType === 'exam_doctor') {
        totalMinutes = 180;
        typeName = 'สอบหมอใหม่ (+3 ชม.)';
      } else if (data.dutyType === 'mentor') {
        totalMinutes = 60;
        typeName = 'พี่เลี้ยงหมอใหม่ (+1 ชม.)';
      } else if (data.dutyType === 'queue_manager_bonus') {
        totalMinutes = 120;
        typeName = 'โบนัสรันคิว (+2 ชม.)';
      } else {
        totalMinutes = data.customMinutes || 60;
        dutyTypeValue = data.customReason?.trim() || 'เวรพิเศษ';
        typeName = `${dutyTypeValue} (+${Math.floor(totalMinutes / 60)} ชม. ${totalMinutes % 60} นาที)`;
      }
      
      const clockInDate = new Date();
      const clockOutDate = new Date(clockInDate.getTime() + totalMinutes * 60000);
      
      const { error } = await supabase.from('duty_logs').insert([{
        discord_id: data.selectedUserId,
        clock_in: clockInDate.toISOString(),
        clock_out: clockOutDate.toISOString(),
        status: 'completed',
        total_break_minutes: 0,
        total_duty_minutes: totalMinutes,
        duty_type: dutyTypeValue,
        granted_by: user?.discord_id
      }]);

      if (error) throw error;

      // Notify the target user
      await supabase.from('notifications').insert({
        discord_id: data.selectedUserId,
        title: 'คุณได้รับมอบหมายเวรพิเศษ',
        message: `ผู้บริหารได้มอบหมายเวร ${typeName} ให้คุณเรียบร้อยแล้ว`,
        type: 'special_duty',
        link: '/duty'
      });
      
      Swal.fire('สำเร็จ', `มอบหมายเวร ${typeName} เรียบร้อยแล้ว`, 'success');
      queryClient.invalidateQueries({ queryKey: ['duty'] });
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      onClose();
    } catch (error: any) {
      console.error(error);
      Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
            <Award size={22} className="text-[var(--primary)]" />
            มอบหมายเวรพิเศษ
          </h2>
          <button type="button" className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-none bg-transparent" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">เลือกหมอ</label>
            <Controller
              name="selectedUserId"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  options={users.map(u => ({ value: u.discord_id, label: u.ic_name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- เลือกหมอ --"
                  searchable={true}
                />
              )}
            />
            {errors.selectedUserId && <span className="text-red-500 text-sm mt-1 block">{errors.selectedUserId.message}</span>}
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">ประเภทงานพิเศษ</label>
            <Controller
              name="dutyType"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  options={[
                    { value: 'exam_doctor', label: 'สอบหมอใหม่ (+3 ชม.)' },
                    { value: 'mentor', label: 'พี่เลี้ยงหมอใหม่ (+1 ชม. + เงิน 500,000)' },
                    { value: 'queue_manager_bonus', label: 'โบนัสรันคิว (+2 ชม.)' },
                    { value: 'custom', label: 'อื่นๆ / กำหนดเวลาเอง' }
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
                        {errors.dutyType && <span className="text-red-500 text-sm mt-1 block">{errors.dutyType.message}</span>}
          </div>
          
          {watch('dutyType') === 'custom' && (
            <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ระบุเหตุผล / ประเภท</label>
                <input 
                  type="text" 
                  {...register('customReason')}
                  placeholder="เช่น ช่วยงานอีเวนต์, มอบเวลาพิเศษ" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">จำนวนเวลา (นาที)</label>
                <input 
                  type="number" 
                  {...register('customMinutes', { valueAsNumber: true })}
                  defaultValue={60}
                  min={1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100">
            <button type="button" className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white w-full sm:w-auto" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl border-none bg-[var(--primary)] text-white font-semibold hover:opacity-90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
