import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Users, ChevronRight, CheckCircle2 } from 'lucide-react';

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
        Swal.fire('ข้อผิดพลาด', 'ไม่พบรหัสยืนยันตัวตนจาก Discord ของคุณ', 'error');
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
        Swal.fire({
          title: 'ไม่มีสิทธิ์เข้าถึงระบบ',
          text: 'คุณไม่มีสิทธิ์เข้าใช้งานระบบแพทย์ หากคุณเป็นบุคลากรแพทย์โปรดติดต่อผู้อำนวยการ',
          icon: 'error',
          confirmButtonColor: '#ef4444'
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
      Swal.fire('เกิดข้อผิดพลาดบางอย่าง', err.message || 'Error during login flow', 'error');
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
      Swal.fire('ข้อผิดพลาด', 'เกิดปัญหาในการเข้าสู่ระบบ โปรดลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icName.trim() || !icPhone.trim()) {
      Swal.fire('ข้อมูลไม่ครบ', 'โปรดกรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วนก่อนบันทึก', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('users').insert([{
        discord_id: discordId,
        ic_name: icName,
        ic_phone: icPhone,
        avatar_url: avatarUrl,
        role: 'user' // Default role for new users
      }]);
      if (error) throw error;
      await supabase.auth.signOut();
      Swal.fire({
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'ระบบได้บันทึกข้อมูลของคุณแล้ว โปรดรอผู้อำนวยการปรับสิทธิ์ให้คุณสามารถเข้าใช้งานระบบได้',
        icon: 'success',
        confirmButtonColor: '#8b5cf6'
      }).then(() => setIsRegistering(false));
    } catch (error: any) {
      Swal.fire({
        title: 'ข้อผิดพลาด',
        text: `ไม่สามารถลงทะเบียนได้: ${error?.message || 'โปรดติดต่อผู้ดูแลระบบ'}`,
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DiscordSVG = () => (
    <svg className="w-6 h-6 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.56,65.36c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Zm42.24,0c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Z"/>
    </svg>
  );

  const renderRightContent = () => {
    if (isCheckingAuth) {
      return (
        <motion.div 
          key="loading"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto text-center"
        >
          <div className="w-16 h-16 border-4 border-slate-100 border-t-[#8b5cf6] rounded-full animate-spin mb-6"></div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">กำลังตรวจสอบสิทธิ์...</h3>
          <p className="text-slate-500">Authenticating your secure session</p>
        </motion.div>
      );
    }

    if (isRegistering) {
      return (
        <motion.div 
          key="register"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Discord Avatar" className="w-16 h-16 rounded-full shadow-md object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                <Users className="text-slate-400" size={32} />
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 m-0">ลงทะเบียนบุคลากรใหม่</h3>
              <p className="text-slate-500 m-0 text-sm mt-1">กรอกข้อมูลประจำตัว (IC) เพื่อส่งคำร้อง</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อ-นามสกุล IC</label>
              <input
                type="text"
                value={icName}
                onChange={(e) => setIcName(e.target.value)}
                placeholder="เช่น Dr. สมชาย ใจดี"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6] transition-all bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">เบอร์โทรศัพท์ IC</label>
              <input
                type="text"
                value={icPhone}
                onChange={(e) => setIcPhone(e.target.value)}
                placeholder="เช่น 012-345-6789"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/20 focus:border-[#8b5cf6] transition-all bg-slate-50 focus:bg-white"
                required
              />
            </div>
            
            <div className="pt-4 space-y-3">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-3.5 rounded-xl font-bold transition-colors shadow-[0_4px_12px_rgba(139,92,246,0.3)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> กำลังบันทึกข้อมูล...</>
                ) : (
                  <>บันทึกและส่งคำร้อง <ChevronRight size={20} /></>
                )}
              </button>
              
              <button
                type="button"
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 py-3.5 rounded-xl font-semibold transition-colors"
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
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-[500px] mx-auto flex flex-col justify-center"
      >
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-4xl xl:text-5xl font-black text-slate-800 mb-6 tracking-tight leading-[1.2]">
            ลงชื่อเข้าใช้งาน<br />
            <span className="text-[#8b5cf6]">ระบบบุคลากรแพทย์</span>
          </h2>
          <p className="text-slate-500 leading-relaxed text-lg xl:text-xl">
            ระบบยืนยันตัวตนผ่าน Discord ที่มีความปลอดภัยระดับสูง<br className="hidden md:block" />
            สำหรับเจ้าหน้าที่หน่วยงาน Medic E-Service
          </p>
        </div>

        <button 
          className="group w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-5 px-6 rounded-[20px] font-bold text-xl transition-all duration-300 shadow-[0_8px_24px_rgba(88,101,242,0.25)] hover:shadow-[0_12px_32px_rgba(88,101,242,0.4)] hover:-translate-y-1 flex items-center justify-center mb-10"
          onClick={handleDiscordLogin}
        >
          <DiscordSVG />
          เข้าสู่ระบบด้วย Discord
        </button>

        <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[20px] border border-slate-200">
          <Shield className="text-[#8b5cf6] shrink-0 mt-1" size={24} />
          <p className="text-sm xl:text-base text-slate-500 m-0 leading-relaxed">
            ระบบจะดึงข้อมูลสาธารณะจาก Discord ของท่าน (เช่น รูปโปรไฟล์ และไอดี) เพื่อใช้สำหรับการตรวจสอบสิทธิ์เท่านั้น และจะถูกเก็บรักษาเป็นความลับ
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-white overflow-hidden">
      
      {/* LEFT - Branding (Hidden on very small screens, visible on md+) */}
      <div className="hidden md:flex flex-col w-[45%] lg:w-[40%] bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#6d28d9] p-12 text-white relative overflow-hidden justify-between">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8b5cf6] opacity-30 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
        
        {/* Top Logo & Title */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl overflow-hidden p-2">
            <img src="/logo.png" alt="MEDIC WIPTOWN" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <h1 className="text-5xl xl:text-6xl font-black mb-2 tracking-tight leading-[1.1] text-white">MEDIC<br/><span className="text-purple-200">E-SERVICE</span></h1>
          <p className="text-purple-200 text-xl font-medium tracking-wide mt-2">ระบบจัดการบุคลากรแพทย์แบบครบวงจร</p>
        </motion.div>

        {/* Middle Stats / Features */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 flex flex-col gap-4"
        >
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-fit">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-purple-200 text-base font-medium">ระบบออนไลน์ตลอดเวลา</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-fit">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-white" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">V2</div>
              <div className="text-purple-200 text-base font-medium">เวอร์ชันอัปเกรดล่าสุด</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Footer */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
          className="relative z-10 pt-8 border-t border-white/10"
        >
          <p className="text-purple-300 text-sm font-medium m-0 tracking-wide">
            WIP TOWN • Medic Department • 2026
          </p>
        </motion.div>
      </div>

      {/* RIGHT - Login / Register Form */}
      <div className="w-full md:w-[55%] lg:w-[60%] flex items-center justify-center p-8 md:p-12 relative">
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          <span className="font-bold text-slate-800 tracking-tight">MEDIC WIPTOWN</span>
        </div>

        <AnimatePresence mode="wait">
          {renderRightContent()}
        </AnimatePresence>
      </div>

    </div>
  );
}
