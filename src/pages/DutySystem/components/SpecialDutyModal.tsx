import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import Swal from 'sweetalert2';
import { X } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>มอบเวลาพิเศษ</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label>เลือกหมอ</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="modal-input"
              required
            >
              <option value="">-- เลือกหมอ --</option>
              {users.map(u => (
                <option key={u.discord_id} value={u.discord_id}>{u.ic_name}</option>
              ))}
            </select>
          </div>
          
          <div className="modal-form-group">
            <label>ประเภทงานพิเศษ</label>
            <select
              value={dutyType}
              onChange={e => setDutyType(e.target.value)}
              className="modal-input"
            >
              <option value="exam_doctor">สอบหมอใหม่ (+3 ชม.)</option>
              <option value="mentor">พี่เลี้ยงหมอใหม่ (+1 ชม. + เงิน 500,000)</option>
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="modal-btn cancel" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="modal-btn save" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
