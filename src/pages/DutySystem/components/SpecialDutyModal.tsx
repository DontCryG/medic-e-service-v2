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
  dutyType: z.enum(['exam_doctor', 'mentor'])
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

  const { control, handleSubmit, formState: { errors } } = useForm<SpecialDutyFormValues>({
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
      const totalMinutes = data.dutyType === 'exam_doctor' ? 180 : 60;
      
      const { error } = await supabase.from('duty_logs').insert([{
        discord_id: data.selectedUserId,
        clock_in: now,
        clock_out: now,
        status: 'completed',
        total_break_minutes: 0,
        total_duty_minutes: totalMinutes,
        duty_type: data.dutyType,
        granted_by: user?.discord_id
      }]);

      if (error) throw error;

      
      // Notify the target user
      await supabase.from('notifications').insert({
        discord_id: data.selectedUserId,
        title: 'คุณได้รับมอบหมายเวรพิเศษ',
        message: `ผู้บริหารได้มอบหมายเวร ${data.dutyType === 'exam_doctor' ? 'สอบหมอใหม่' : 'พี่เลี้ยงหมอใหม่'} ให้คุณเรียบร้อยแล้ว`,
        type: 'special_duty',
        link: '/duty'
      });
      
      Swal.fire('สำเร็จ', 'มอบหมายเวรพิเศษเรียบร้อยแล้ว', 'success');
      queryClient.invalidateQueries({ queryKey: ['duty_logs'] });
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
                    { value: 'mentor', label: 'พี่เลี้ยงหมอใหม่ (+1 ชม. + เงิน 500,000)' }
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.dutyType && <span className="text-red-500 text-sm mt-1 block">{errors.dutyType.message}</span>}
          </div>
          
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
