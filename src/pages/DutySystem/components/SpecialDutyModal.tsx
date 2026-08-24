import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import Swal from 'sweetalert2';

interface SpecialDutyModalProps {
  onClose: () => void;
}

export default function SpecialDutyModal({ onClose }: SpecialDutyModalProps) {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dutyType, setDutyType] = useState('exam_doctor');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกหมอ', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const totalMinutes = dutyType === 'exam_doctor' ? 180 : 60;
      
      const { error } = await supabase.from('duty_logs').insert([{
        discord_id: selectedUserId,
        clock_in: now,
        clock_out: now,
        status: 'completed',
        total_break_minutes: 0,
        total_duty_minutes: totalMinutes,
        duty_type: dutyType,
        granted_by: user?.discord_id
      }]);

      if (error) throw error;

      Swal.fire('สำเร็จ', 'มอบเวลาพิเศษเรียบร้อยแล้ว', 'success');
      onClose();
    } catch (error: any) {
      console.error(error);
      Swal.fire('ข้อผิดพลาด', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-scale" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>มอบเวลาพิเศษ (Admin)</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>เลือกหมอ</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              required
            >
              <option value="">-- เลือกหมอ --</option>
              {users.map(u => (
                <option key={u.discord_id} value={u.discord_id}>{u.ic_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ประเภทงานพิเศษ</label>
            <select
              value={dutyType}
              onChange={e => setDutyType(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="exam_doctor">สอบหมอใหม่ (+3 ชม.)</option>
              <option value="mentor">พี่เลี้ยงหมอใหม่ (+1 ชม. + เงิน 500,000)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}>
              ยกเลิก
            </button>
            <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
