import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useCreateLeave } from '../hooks/useLeaveMutations';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import SmartSelect from '../../../components/common/SmartSelect';

interface LeaveRequestModalProps {
  onClose: () => void;
  profile: any;
}

export default function LeaveRequestModal({ onClose, profile }: LeaveRequestModalProps) {
  const [leaveType, setLeaveType] = useState('leave');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState('');

  const createLeaveMutation = useCreateLeave();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    
    // If resign, end date is same as start date
    const finalEndDate = leaveType === 'resign' ? startDate : endDate;
    if (!finalEndDate) return;

    if (leaveType === 'vacation') {
      // 1. Check if they have used vacation before (pending or approved)
      const { data: pastVacations } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('discord_id', profile.discord_id)
        .eq('leave_type', 'vacation')
        .in('status', ['pending', 'approved']);
      
      if (pastVacations && pastVacations.length > 0) {
        Swal.fire('ไม่สามารถยื่นลาพักร้อนได้', 'คุณได้ใช้สิทธิ์ลาพักร้อนไปแล้ว (สิทธิ์มีเพียง 1 ครั้ง)', 'error');
        return;
      }

      // 2. Check if they have worked for 30 distinct days
      const { data: dutyLogs } = await supabase
        .from('duty_logs')
        .select('clock_in')
        .eq('discord_id', profile.discord_id)
        .eq('status', 'completed');
      
      const distinctDays = new Set((dutyLogs || []).map(log => {
        const d = new Date(log.clock_in);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }));

      if (distinctDays.size < 30) {
        Swal.fire('ไม่สามารถยื่นลาพักร้อนได้', `คุณต้องเข้าเวรครบ 30 วันก่อนถึงจะใช้สิทธิ์ได้ (ปัจจุบันเข้าเวรแล้ว ${distinctDays.size} วัน)`, 'error');
        return;
      }
    }

    createLeaveMutation.mutate({
      discord_id: profile.discord_id,
      leave_type: leaveType,
      start_date: startDate.toISOString().split('T')[0],
      end_date: finalEndDate.toISOString().split('T')[0],
      reason
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={22} color="#3b82f6" />
            ยื่นใบลางาน
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              ประเภทการลา
            </label>
            <SmartSelect
              value={leaveType}
              onChange={setLeaveType}
              options={[
                { value: 'leave', label: 'ลางาน' },
                { value: 'vacation', label: 'ลาพักร้อน' },
                { value: 'resign', label: 'ลาออก' }
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: leaveType === 'resign' ? '1fr' : '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {leaveType === 'resign' ? 'วันที่ลาออก' : 'ตั้งแต่วันที่'}
              </label>
              <SmartDatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={leaveType === 'resign' ? startDate : endDate}
              />
            </div>
            {leaveType !== 'resign' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  ถึงวันที่
                </label>
                <SmartDatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              เหตุผลการลา
            </label>
            <textarea 
              className="form-input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              required
              placeholder="ระบุเหตุผลการลาของคุณ..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={createLeaveMutation.isPending}
              style={{ 
                padding: '0.75rem 1.5rem', 
                borderRadius: '8px', 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                cursor: createLeaveMutation.isPending ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: createLeaveMutation.isPending ? 0.7 : 1
              }}
            >
              {createLeaveMutation.isPending ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอลา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
