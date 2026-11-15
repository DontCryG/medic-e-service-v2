import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { enterpriseSwal, showErrorAlert } from '@/utils/alert';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Users, ChevronRight, CheckCircle2, Stethoscope, Lock } from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [discordId, setDiscordId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [icName, setIcName] = useState('');
  const [icPhone, setIcPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserInDatabase(session);
      } else {
        setIsCheckingAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsCheckingAuth(true);
        checkUserInDatabase(session);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUserInDatabase = async (session: any) => {
    try {
      const providerId = session.user.user_metadata?.provider_id || session.user.identities?.find((i: any) => i.provider === 'discord')?.id;
      const avatar = session.user.user_metadata?.avatar_url || '';

      if (!providerId) {
        await supabase.auth.signOut();
        showErrorAlert('ข้อผิดพลาด', 'ไม่พบรหัสยืนยันตัวตนจาก Discord ของคุณ');
        setIsCheckingAuth(false);
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*, positions(*)')
        .eq('discord_id', providerId)
        .maybeSingle();

      if (error) console.error(error);

      if (!userData) {
        setDiscordId(providerId);
        setAvatarUrl(avatar);
        setIsRegistering(true);
        setIsCheckingAuth(false);
        return;
      }

      if (userData.role === 'user' || userData.role === 'resigned') {
        await supabase.auth.signOut();
        enterpriseSwal.fire({
          title: 'ไม่มีสิทธิ์เข้าถึงระบบ',
          text: 'คุณไม่มีสิทธิ์เข้าใช้งานระบบแพทย์ หากคุณเป็นบุคลากรแพทย์โปรดติดต่อผู้อำนวยการ',
          icon: 'error'
        });
        setIsCheckingAuth(false);
        return;
      }

      if (userData.avatar_url !== avatar) {
        await supabase.from('users').update({ avatar_url: avatar }).eq('discord_id', providerId);
      }

      login({
        discord_id: userData.discord_id,
        ic_name: userData.ic_name,
        ic_phone: userData.ic_phone || undefined,
        avatar_url: avatar,
        position_id: userData.position_id,
        role: userData.role,
        position: userData.positions as any
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      await supabase.auth.signOut();
      showErrorAlert('เกิดข้อผิดพลาดบางอย่าง', err.message || 'Error during login flow');
      setIsCheckingAuth(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      showErrorAlert('ข้อผิดพลาด', 'เกิดปัญหาในการเข้าสู่ระบบ โปรดลองใหม่อีกครั้ง');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icName.trim() || !icPhone.trim()) {
      enterpriseSwal.fire({
        title: 'ข้อมูลไม่ครบ',
        text: 'โปรดกรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วนก่อนบันทึก',
        icon: 'warning'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('users').insert([{
        discord_id: discordId,
        ic_name: icName,
        ic_phone: icPhone,
        avatar_url: avatarUrl,
        role: 'user'
      }]);
      if (error) throw error;
      await supabase.auth.signOut();
      enterpriseSwal.fire({
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'ระบบได้บันทึกข้อมูลของคุณแล้ว โปรดรอผู้อำนวยการปรับสิทธิ์ให้คุณสามารถเข้าใช้งานระบบได้',
        icon: 'success'
      }).then(() => setIsRegistering(false));
    } catch (error: any) {
      showErrorAlert('ข้อผิดพลาด', `ไม่สามารถลงทะเบียนได้: ${error?.message || 'โปรดติดต่อผู้ดูแลระบบ'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const DiscordSVG = () => (
    <svg className="w-4 h-4 shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.56,65.36c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Zm42.24,0c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Z"/>
    </svg>
  );

  const renderRightContent = () => {
    if (isCheckingAuth) {
      return (
        <motion.div 
          key="loading"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center w-full max-w-sm mx-auto text-center py-12"
        >
          <div className="w-10 h-10 border-2 border-slate-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <h3 className="text-sm font-bold text-slate-800 m-0">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</h3>
          <p className="text-xs text-slate-400 mt-1 m-0">Authenticating secure session</p>
        </motion.div>
      );
    }

    if (isRegistering) {
      return (
        <motion.div 
          key="register"
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-[380px] mx-auto"
        >
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-12 h-12 rounded-xl border border-slate-200 object-cover shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                <Users size={22} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 m-0">ลงทะเบียนบุคลากรใหม่</h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5 truncate">Discord ID: {discordId}</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่อ-นามสกุล IC <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={icName}
                onChange={(e) => setIcName(e.target.value)}
                placeholder="เช่น นพ. ธนาวิน ศรีสุข"
                className="w-full px-3 py-2 rounded-lg border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                เบอร์โทรศัพท์ IC <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={icPhone}
                onChange={(e) => setIcPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3 py-2 rounded-lg border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all font-medium"
                required
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <span>บันทึกและส่งคำขอสิทธิ์</span>
                    <ChevronRight size={14} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="w-full h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                onClick={async () => { await supabase.auth.signOut(); setIsRegistering(false); }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </motion.div>
      );
    }

    return (
      <motion.div 
        key="login"
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -8 }}
        className="w-full max-w-[380px] mx-auto flex flex-col"
      >
        <div className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 text-[10px] font-bold uppercase tracking-wider mb-3">
            <Lock size={12} className="text-purple-600" />
            <span>Secure Medical Gateway</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight m-0">
            ลงชื่อเข้าใช้งานระบบ
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed m-0">
            เข้าสู่ระบบปฏิบัติงานสำหรับแพทย์และบุคลากรทางการแพทย์ WIP TOWN
          </p>
        </div>

        {/* Discord OAuth Action */}
        <button 
          onClick={handleDiscordLogin}
          className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.99] text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer border-none mb-6"
        >
          <DiscordSVG />
          <span>เข้าสู่ระบบด้วย Discord</span>
        </button>

        {/* Minimal Security Info Note */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
          <Shield size={16} className="text-purple-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 m-0 leading-relaxed font-normal">
            ระบบจะเชื่อมต่อข้อมูลบัญชี Discord เพื่อตรวจสอบสิทธิ์และสถานะการปฏิบัติงานเท่านั้น ข้อมูลทั้งหมดถูกรักษาความปลอดภัยตามมาตรฐานของหน่วยงานแพทย์
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-[#fafafa] antialiased select-none">
      
      {/* LEFT - Minimal Clean White Clinical Hero (Visible on md+) */}
      <div className="hidden md:flex flex-col w-[45%] lg:w-[42%] bg-white border-r border-slate-200/80 p-10 lg:p-12 justify-between relative overflow-hidden">
        
        {/* Top: Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs"
              style={{ width: '40px', height: '40px', minWidth: '40px', maxWidth: '40px', overflow: 'hidden' }}
            >
              <img 
                src="/logo.png" 
                alt="Logo" 
                width="30"
                height="30"
                className="w-7 h-7 object-contain shrink-0" 
                style={{ width: '30px', height: '30px', maxWidth: '30px', maxHeight: '30px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">MEDIC</span>
                <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">V2.0</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider">WIP TOWN MEDICAL SERVICE</span>
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-snug m-0">
            ระบบบริหารจัดการ<br />
            <span className="text-purple-700">หน่วยงานแพทย์แบบครบวงจร</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">
            ศูนย์กลางข้อมูลการปฏิบัติงานของแพทย์ บริหารคิวผู้ป่วย บันทึกเวลาเข้า-ออกเวร คำนวณค่าตอบแทน และบริหารจัดการคลังเวชภัณฑ์
          </p>
        </div>

        {/* Middle: Minimal Clean Telemetry Badges */}
        <div className="relative z-10 flex flex-col gap-2.5 my-8">
          <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
              <Activity size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">24/7 Realtime Live Service</div>
              <div className="text-[11px] text-slate-500 font-medium">ตรวจจับสถานะบุคลากรในเวรแบบเรียลไทม์</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
              <Stethoscope size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Patient Queue Automation</div>
              <div className="text-[11px] text-slate-500 font-medium">รันคิวผู้ป่วย เรียกเคส และรายงานโบนัสรันคิว</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">High Precision Salary Engine</div>
              <div className="text-[11px] text-slate-500 font-medium">คำนวณชั่วโมงเวร ค่ารอบเวร และสลิปพิมพ์มาตรฐาน</div>
            </div>
          </div>
        </div>

        {/* Bottom: Version & Copyright */}
        <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>WIP TOWN • Medic Division</span>
          <span>Version 2.0</span>
        </div>
      </div>

      {/* RIGHT - Auth Gateway Container */}
      <div className="w-full md:w-[55%] lg:w-[58%] flex items-center justify-center p-6 sm:p-12 relative bg-[#fafafa]">
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="md:hidden absolute top-6 left-6 flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden"
            style={{ width: '32px', height: '32px', minWidth: '32px', maxWidth: '32px' }}
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              width="24"
              height="24"
              className="w-6 h-6 object-contain" 
              style={{ width: '24px', height: '24px', maxWidth: '24px', maxHeight: '24px' }}
            />
          </div>
          <span className="font-bold text-xs text-slate-900 tracking-tight">MEDIC V2 • WIP TOWN</span>
        </div>

        <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {renderRightContent()}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
