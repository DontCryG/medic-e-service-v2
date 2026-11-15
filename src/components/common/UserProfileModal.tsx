import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  X, 
  User as UserIcon, 
  Phone, 
  Image as ImageIcon, 
  ShieldCheck, 
  Save, 
  Sparkles, 
  Stethoscope
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '@/utils/alert';
import { getInitial } from '@/pages/PersonnelSystem/utils/personnelUtils';
import { getDiscordAvatar } from '@/utils/discordUtils';

const profileSchema = z.object({
  ic_name: z.string().trim().min(2, 'กรุณาระบุชื่อ-นามสกุล IC อย่างน้อย 2 ตัวอักษร'),
  ic_phone: z.string().trim().min(4, 'กรุณาระบุเบอร์โทรศัพท์ IC ที่ถูกต้อง'),
  avatar_url: z.string().trim().optional().or(z.literal(''))
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingDiscord, setIsSyncingDiscord] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ic_name: user?.ic_name || '',
      ic_phone: user?.ic_phone || '',
      avatar_url: user?.avatar_url || ''
    }
  });

  const currentAvatarUrl = watch('avatar_url');

  if (!isOpen || !user) return null;

  const handleSyncDiscordAvatar = async () => {
    setIsSyncingDiscord(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const discordAvatar = getDiscordAvatar(session);
      if (discordAvatar) {
        setValue('avatar_url', discordAvatar, { shouldDirty: true, shouldValidate: true });
        showSuccessAlert('ดึงรูปสำเร็จ!', 'ดึงรูปโปรไฟล์ล่าสุดจาก Discord ของคุณเรียบร้อยแล้ว');
      } else {
        showErrorAlert('ไม่พบรูปภาพ', 'ไม่พบรูปภาพโปรไฟล์จากบัญชี Discord ที่เชื่อมต่อไว้');
      }
    } catch (err: any) {
      showErrorAlert('ผิดพลาด', err.message || 'ไม่สามารถดึงรูปภาพจาก Discord ได้');
    } finally {
      setIsSyncingDiscord(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ic_name: data.ic_name.trim(),
        ic_phone: data.ic_phone.trim(),
        avatar_url: data.avatar_url?.trim() || null
      };

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('discord_id', user.discord_id);

      if (error) throw error;

      // Update Zustand local store immediately
      updateUser({
        ic_name: payload.ic_name,
        ic_phone: payload.ic_phone,
        avatar_url: payload.avatar_url || undefined
      });

      // Invalidate queries so lists update everywhere
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['queue_users'] });
      queryClient.invalidateQueries({ queryKey: ['duty_logs'] });
      queryClient.invalidateQueries({ queryKey: ['duty', 'session'] });

      showSuccessAlert('บันทึกสำเร็จ!', 'อัปเดตข้อมูลโปรไฟล์ส่วนตัวของคุณเรียบร้อยแล้ว');
      onClose();
    } catch (err: any) {
      console.error('Update profile error:', err);
      showErrorAlert('บันทึกไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลโปรไฟล์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-150" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/90 animate-in zoom-in-98 duration-150" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
              <UserIcon size={19} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 m-0 tracking-tight">
                แก้ไขโปรไฟล์ส่วนตัว (My Profile)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium m-0 mt-0.5">
                ปรับแต่งข้อมูลประจำตัว ชื่อ-นามสกุล และเบอร์โทรศัพท์ IC
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer" 
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4.5">
          
          {/* Avatar Banner & Quick Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50/90 to-purple-50/30 border border-slate-200/80 flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-purple-100/70 border-2 border-purple-200 overflow-hidden flex items-center justify-center text-purple-700 font-black text-xl shadow-xs">
                {currentAvatarUrl ? (
                  <img 
                    src={currentAvatarUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  getInitial(user.ic_name)
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-600 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                  ID: {user.discord_id}
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/70 uppercase">
                  {user.role}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800 truncate">
                {user.ic_name || 'ไม่ระบุชื่อ'}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {user.position?.name || 'บุคลากรทางการแพทย์'}
              </div>
              <button 
                type="button" 
                onClick={handleSyncDiscordAvatar}
                disabled={isSyncingDiscord}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200/80 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
              >
                <Sparkles size={13} className={isSyncingDiscord ? 'animate-spin text-purple-600' : 'text-purple-600'} />
                <span>{isSyncingDiscord ? 'กำลังซิงค์รูป...' : 'ดึงรูปจาก Discord'}</span>
              </button>
            </div>
          </div>

          {/* IC Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ชื่อ-นามสกุล IC <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                <Stethoscope size={16} />
              </div>
              <input 
                type="text"
                {...register('ic_name')}
                placeholder="เช่น นพ. ธนาวิน ศรีสุข"
                className="w-full !pl-11 pr-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            {errors.ic_name && (
              <span className="text-rose-500 text-[11px] font-medium mt-1 block">
                {errors.ic_name.message}
              </span>
            )}
          </div>

          {/* IC Phone Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              เบอร์โทรศัพท์ IC <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                <Phone size={16} />
              </div>
              <input 
                type="text"
                {...register('ic_phone')}
                placeholder="เช่น 081-234-5678"
                className="w-full !pl-11 pr-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 font-mono outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            {errors.ic_phone && (
              <span className="text-rose-500 text-[11px] font-medium mt-1 block">
                {errors.ic_phone.message}
              </span>
            )}
          </div>

          {/* Custom Avatar URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ลิงก์รูปภาพโปรไฟล์ (Avatar URL)
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                <ImageIcon size={16} />
              </div>
              <input 
                type="url"
                {...register('avatar_url')}
                placeholder="https://images.unsplash.com/... หรือ ลิงก์รูปภาพอื่นๆ"
                className="w-full !pl-11 pr-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 font-mono outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15 transition-all placeholder:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 m-0 mt-1">
              รองรับ URL รูปภาพไฟล์ .png, .jpg, .webp หรือกดปุ่ม "ดึงรูปจาก Discord" ด้านบน
            </p>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-xl flex items-start gap-2.5 text-slate-600">
            <ShieldCheck size={16} className="text-purple-600 shrink-0 mt-0.5" />
            <p className="text-xs m-0 leading-relaxed text-slate-600 font-normal">
              ตำแหน่งหน้าที่และสิทธิ์การเข้าใช้งานระบบถูกกำหนดโดยผู้อำนวยการโรงพยาบาล หากมีการเลื่อนขั้นหรือปรับหน้าที่ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-98"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>บันทึกข้อมูลส่วนตัว</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}