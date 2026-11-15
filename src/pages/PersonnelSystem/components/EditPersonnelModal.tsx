import { useState } from 'react';
import { X, ShieldAlert, UserCog } from 'lucide-react';
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
      
      toast.success('บันทึกข้อมูลบุคลากรสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
              <UserCog size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 m-0">แก้ไขข้อมูลบุคลากร</h2>
          </div>
          <button 
            type="button" 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        
        {/* User Card Pill */}
        <div className="p-5 pb-0">
          <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div 
              className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 border border-purple-200/60 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : getInitial(user.ic_name)}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 truncate">{user.ic_name}</div>
              <div className="text-[11px] font-mono text-slate-400 truncate">ID: {user.discord_id}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">บทบาท (Role) <span className="text-rose-500">*</span></label>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ตำแหน่ง (Position)</label>
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
            <div className="flex gap-2.5 items-start text-rose-700 text-xs bg-rose-50/80 p-3 rounded-xl border border-rose-200/60 leading-relaxed font-medium">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span><strong>คำเตือน:</strong> หากเลือก User หรือ Resigned ผู้ใช้งานท่านนี้จะไม่สามารถเข้าถึงระบบงานแพทย์ได้อีกต่อไป</span>
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
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
