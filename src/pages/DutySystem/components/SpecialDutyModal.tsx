import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { showSuccessAlert, showErrorAlert } from '@/utils/alert';
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

      await showSuccessAlert('สำเร็จ', `มอบหมายเวร ${typeName} เรียบร้อยแล้ว`);
      queryClient.invalidateQueries({ queryKey: ['duty'] });
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      onClose();
    } catch (error: any) {
      console.error(error);
      showErrorAlert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200/90 animate-in zoom-in-98 duration-150" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600">
              <Award size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 m-0">
              มอบหมายเวรพิเศษ
            </h2>
          </div>
          <button 
            type="button" 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">เลือกแพทย์ <span className="text-rose-500">*</span></label>
            <Controller
              name="selectedUserId"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  options={users.map(u => ({ value: u.discord_id, label: u.ic_name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- เลือกแพทย์ผู้รับมอบหมาย --"
                  searchable={true}
                />
              )}
            />
            {errors.selectedUserId && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.selectedUserId.message}</span>}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทงานพิเศษ</label>
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
            {errors.dutyType && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.dutyType.message}</span>}
          </div>
          
          {watch('dutyType') === 'custom' && (
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ระบุเหตุผล / ประเภท</label>
                <input 
                  type="text" 
                  {...register('customReason')}
                  placeholder="เช่น ช่วยงานอีเวนต์, มอบเวลาพิเศษ" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนเวลา (นาที)</label>
                <input 
                  type="number" 
                  {...register('customMinutes', { valueAsNumber: true })}
                  defaultValue={60}
                  min={1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 bg-white"
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-2.5 justify-end mt-4 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded-lg border-none bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกมอบหมาย'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
