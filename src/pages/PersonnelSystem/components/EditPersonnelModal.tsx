import { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { getInitial } from '../utils/personnelUtils';
import SmartSelect from '../../../components/common/SmartSelect';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const editSchema = z.object({
  role: z.string().min(1, 'กรุณาเลือกบทบาท'),
  position_id: z.string().optional().nullable(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EditPersonnelModal({
  user,
  availablePositions,
  onClose,
  onSuccess
}: {
  user: any;
  availablePositions: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, watch } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      role: user.role || 'user',
      position_id: user.position_id || ''
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: EditFormValues) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: data.role, position_id: data.position_id || null })
        .eq('discord_id', user.discord_id);

      if (error) throw error;
      
      toast.success('บันทึกข้อมูลสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
          <h2 className="text-2xl font-bold text-slate-800 m-0">แก้ไขข้อมูลบุคลากร</h2>
          <button 
            className="bg-transparent border-none text-slate-500 cursor-pointer p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-center" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6 flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div 
            className="w-[50px] h-[50px] rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-lg overflow-hidden shrink-0"
            style={{ padding: user.avatar_url ? 0 : undefined }}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : getInitial(user.ic_name)}
          </div>
          <div>
            <div className="font-semibold text-[1.1rem] text-slate-800">{user.ic_name}</div>
            <div className="text-[0.9rem] text-slate-500">Discord ID: {user.discord_id}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <label className="block font-semibold text-slate-700 mb-2">บทบาท (Role)</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'user', label: 'User (ประชาชนทั่วไป/ผู้ดูแลระบบย่อย)' },
                    { value: 'medic', label: 'Medic (เจ้าหน้าที่แพทย์)' },
                    { value: 'admin', label: 'Admin (ผู้ดูแลระบบ)' },
                    { value: 'resigned', label: 'Resigned (ลาออก/พ้นสภาพ)' }
                  ]}
                />
              )}
            />
          </div>

          <div className="mb-5">
            <label className="block font-semibold text-slate-700 mb-2">ตำแหน่ง (Position)</label>
            <Controller
              name="position_id"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  value={field.value || ''}
                  onChange={field.onChange}
                  searchable={true}
                  placeholder="เลือกตำแหน่ง..."
                  options={availablePositions.map(pos => ({
                    value: pos.id,
                    label: pos.name
                  }))}
                />
              )}
            />
          </div>

          {(selectedRole === 'user' || selectedRole === 'resigned') && (
            <div className="flex gap-2 items-start text-red-700 text-[0.85rem] bg-red-50 p-3 rounded-xl">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span><strong>คำเตือน:</strong> การตั้งค่าบทบาทเป็น User/Resigned จะทำให้ผู้ใช้งานคนนี้ไม่สามารถเข้าถึงระบบหลังบ้านได้อีกต่อไป (Access Denied)</span>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-8 sticky -bottom-10 bg-[var(--surface-color)] pt-6 pb-10 -mb-10 border-t border-slate-200 z-10">
            <button type="button" className="px-6 py-3 rounded-[8px] font-semibold text-base cursor-pointer border-none transition-all bg-slate-100 text-slate-600 hover:bg-slate-200" onClick={onClose} disabled={isSaving}>ยกเลิก</button>
            <button type="submit" className="px-6 py-3 rounded-[8px] font-semibold text-base cursor-pointer border-none transition-all bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
