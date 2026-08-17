import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';
import './Portal.css';

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
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleAuthSession(session);
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsCheckingAuth(true);
        await handleAuthSession(session);
      } else if (event === 'SIGNED_OUT') {
        setIsCheckingAuth(false);
        setIsRegistering(false);
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthSession = async (session: any) => {
    try {
      const providerId = session.user.user_metadata?.provider_id || session.user.identities?.find((i: any) => i.provider === 'discord')?.id;
      const avatar = session.user.user_metadata?.avatar_url || '';

      if (!providerId) {
        await supabase.auth.signOut();
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูล Discord ID ได้', 'error');
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
          title: 'การเข้าถึงถูกปฏิเสธ',
          text: 'บัญชีของคุณพ้นสภาพ หรือ ยังไม่ได้รับการอนุมัติสิทธิ์เข้าใช้งาน',
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
        ic_phone: userData.ic_phone,
        avatar_url: avatar,
        position_id: userData.position_id,
        role: userData.role,
        position: userData.positions
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      await supabase.auth.signOut();
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
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อระบบล็อคอินได้', 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icName.trim() || !icPhone.trim()) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบถ้วน', 'warning');
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
      Swal.fire({
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'ระบบได้บันทึกข้อมูลของคุณแล้ว กรุณารอผู้ดูแลระบบอนุมัติสิทธิ์เข้าใช้งาน',
        icon: 'success',
        confirmButtonColor: '#6366f1'
      }).then(() => setIsRegistering(false));
    } catch (error: any) {
      Swal.fire({
        title: 'ข้อผิดพลาด',
        text: `ไม่สามารถลงทะเบียนได้: ${error?.message || 'กรุณาลองใหม่อีกครั้ง'}`,
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DiscordSVG = () => (
    <svg className="discord-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.56,65.36c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Zm42.24,0c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Z"/>
    </svg>
  );

  const renderRight = () => {
    if (isCheckingAuth) {
      return (
        <div className="portal-loading">
          <div className="portal-loading-spinner" />
          <h3>กำลังตรวจสอบสิทธิ์...</h3>
          <p>Authenticating your session</p>
        </div>
      );
    }

    if (isRegistering) {
      return (
        <>
          <div className="portal-register-header">
            {avatarUrl && <img src={avatarUrl} alt="Discord Avatar" />}
            <div>
              <h3>ลงทะเบียนผู้ใช้ใหม่</h3>
              <p>กรอกข้อมูลตัวละคร (IC) ของคุณ</p>
            </div>
          </div>

          <form onSubmit={handleRegister}>
            <div className="portal-field">
              <label>ชื่อ-นามสกุล IC</label>
              <input
                type="text"
                value={icName}
                onChange={(e) => setIcName(e.target.value)}
                placeholder="เช่น Dr. สมชาย ใจดี"
                required
              />
            </div>
            <div className="portal-field">
              <label>เบอร์โทรศัพท์ IC</label>
              <input
                type="text"
                value={icPhone}
                onChange={(e) => setIcPhone(e.target.value)}
                placeholder="เช่น 012-345-6789"
                required
              />
            </div>
            <button type="submit" className="portal-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการลงทะเบียน'}
            </button>
            <button
              type="button"
              className="portal-cancel-btn"
              onClick={async () => { await supabase.auth.signOut(); setIsRegistering(false); }}
            >
              ยกเลิก
            </button>
          </form>
        </>
      );
    }

    return (
      <>
        <h2 className="portal-right-title">เข้าสู่ระบบ</h2>
        <p className="portal-right-desc">
          ใช้บัญชี Discord ของคุณเพื่อเข้าสู่ระบบ<br/>
          Medic E-Service หน่วยงานแพทย์ WIP TOWN
        </p>

        <button className="discord-btn" onClick={handleDiscordLogin}>
          <DiscordSVG />
          เข้าสู่ระบบด้วย Discord
        </button>

        <div className="portal-info-note">
          <span className="portal-info-note-icon">🔐</span>
          <span>ระบบใช้การยืนยันตัวตนผ่าน Discord OAuth2 เท่านั้น บัญชีของคุณต้องได้รับการอนุมัติก่อนใช้งาน</span>
        </div>
      </>
    );
  };

  return (
    <div className="portal-root">
      {/* LEFT — Branding */}
      <div className="portal-left">
        <div className="portal-brand">
          <div className="portal-logo-wrap">
            <img src="/logo.png" alt="MEDIC WIPTOWN" />
          </div>
          <h1 className="portal-brand-title">MEDIC<br/>E-SERVICE</h1>
          <p className="portal-brand-sub">ระบบบริหารงานหน่วยงานแพทย์</p>
        </div>

        <div className="portal-stats">
          <div className="portal-stat">
            <div className="portal-stat-value">24/7</div>
            <div className="portal-stat-label">พร้อมให้บริการ</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat-value">V2</div>
            <div className="portal-stat-label">เวอร์ชันล่าสุด</div>
          </div>
          <div className="portal-stat">
            <div className="portal-stat-value">🔒</div>
            <div className="portal-stat-label">ปลอดภัย</div>
          </div>
        </div>

        <div className="portal-version-badge">WIP TOWN · Medic Department · 2026</div>
      </div>

      {/* RIGHT — Login/Register */}
      <div className="portal-right">
        <div className="portal-right-inner">
          {renderRight()}
        </div>
      </div>
    </div>
  );
}
