import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import Swal from 'sweetalert2';
import { Loader2 } from 'lucide-react';
import './Portal.css';

export default function Portal() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration States
  const [discordId, setDiscordId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [icName, setIcName] = useState('');
  const [icPhone, setIcPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleAuthSession(session);
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    // Listen for auth changes (e.g. returning from OAuth redirect)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsCheckingAuth(true);
        await handleAuthSession(session);
      } else if (event === 'SIGNED_OUT') {
        setIsCheckingAuth(false);
        setIsRegistering(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthSession = async (session: any) => {
    try {
      // Get discord ID and Avatar from session metadata
      const providerId = session.user.user_metadata?.provider_id || session.user.identities?.find((i: any) => i.provider === 'discord')?.id;
      const avatar = session.user.user_metadata?.avatar_url || '';

      if (!providerId) {
        await supabase.auth.signOut();
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูล Discord ID ได้', 'error');
        setIsCheckingAuth(false);
        return;
      }

      // Check if user exists in database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*, positions(*)')
        .eq('discord_id', providerId)
        .maybeSingle();

      if (error) console.error(error);

      if (!userData) {
        // Not found -> Go to registration flow
        setDiscordId(providerId);
        setAvatarUrl(avatar);
        setIsRegistering(true);
        setIsCheckingAuth(false);
        return;
      }

      if (userData) {
        // User found, check role
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

        // Login success
        // Update avatar_url if it changed
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
      }
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
        options: {
          redirectTo: window.location.origin
        }
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
        role: 'user' // Pending status
      }]);

      if (error) throw error;

      await supabase.auth.signOut();
      
      Swal.fire({
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'ระบบได้บันทึกข้อมูลของคุณแล้ว กรุณารอผู้ดูแลระบบอนุมัติสิทธิ์เข้าใช้งาน',
        icon: 'success',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        setIsRegistering(false);
      });

    } catch (error: any) {
      console.error('Registration Error Detail:', error);
      Swal.fire({
        title: 'ข้อผิดพลาด',
        text: `ไม่สามารถลงทะเบียนได้: ${error?.message || error?.details || 'กรุณาลองใหม่อีกครั้ง'}`,
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="portal-container animate-fade-in" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
    }}>
      <div className="portal-content glass-panel animate-slide-up" style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '480px'
      }}>
        
        {isCheckingAuth ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
            <Loader2 className="animate-spin text-primary" size={48} style={{ marginBottom: '1rem', color: '#0ea5e9' }} />
            <h2 style={{ color: '#0f172a', margin: 0 }}>กำลังตรวจสอบสิทธิ์...</h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Authenticating your session</p>
          </div>
        ) : isRegistering ? (
          // Registration Form
          <div className="animate-fade-in text-left">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {avatarUrl && (
                <img 
                  src={avatarUrl} 
                  alt="Discord Avatar" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', border: '3px solid #0ea5e9', padding: '3px' }} 
                />
              )}
              <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>ลงทะเบียนผู้ใช้ใหม่</h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>กรุณากรอกข้อมูลตัวละคร (IC) ของคุณ</p>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>ชื่อ-นามสกุล IC</label>
                <input 
                  type="text"
                  value={icName}
                  onChange={(e) => setIcName(e.target.value)}
                  placeholder="เช่น Dr. สมชาย ใจดี"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', transition: '0.2s', fontSize: '1rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>เบอร์โทรศัพท์ IC</label>
                <input 
                  type="text"
                  value={icPhone}
                  onChange={(e) => setIcPhone(e.target.value)}
                  placeholder="เช่น 012-345-6789"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', transition: '0.2s', fontSize: '1rem'
                  }}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{
                  marginTop: '1rem',
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: '0.2s'
                }}
              >
                {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการลงทะเบียน'}
              </button>

              <button 
                type="button" 
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsRegistering(false);
                }}
                style={{
                  background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontWeight: 500, marginTop: '0.5rem'
                }}
              >
                ยกเลิก
              </button>
            </form>
          </div>
        ) : (
          // Login Form
          <>
            <div className="logo-container" style={{ marginBottom: '2rem' }}>
              <img src="/logo.png" alt="MEDIC WIPTOWN" className="portal-logo" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
            </div>
            
            <h1 className="portal-title" style={{ fontSize: '2rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: 700 }}>MEDIC E - SERVICE</h1>
            <p className="portal-subtitle" style={{ color: '#64748b', marginBottom: '2.5rem' }}>หน่วยงานแพทย์ WIP TOWN (V2)</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className="discord-btn"
                onClick={handleDiscordLogin}
              >
                <svg className="discord-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-80.21ZM42.56,65.36c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Zm42.24,0c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.43,11-9.8,11Z"/>
                </svg>
                เข้าสู่ระบบด้วย Discord
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
