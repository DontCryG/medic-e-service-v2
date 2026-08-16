import { X } from 'lucide-react';
import SmartDateTimePicker from '../../../components/common/SmartDateTimePicker';

function DateTimeInput({ value, onChange, placeholder }: any) {
  return (
    <SmartDateTimePicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
import { getInitial } from '../utils/personnelUtils';

interface AddDutyModalProps {
  user: any;
  dutyClockIn: Date | null;
  setDutyClockIn: (date: Date | null) => void;
  dutyClockOut: Date | null;
  setDutyClockOut: (date: Date | null) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AddDutyModal({
  user,
  dutyClockIn,
  setDutyClockIn,
  dutyClockOut,
  setDutyClockOut,
  isSaving,
  onClose,
  onSave
}: AddDutyModalProps) {
  const calculateTotalDuration = () => {
    if (!dutyClockIn || !dutyClockOut) return null;
    const diff = dutyClockOut.getTime() - dutyClockIn.getTime();
    if (diff <= 0) return <span style={{ color: '#ef4444' }}>เวลาออกเวรต้องอยู่หลังเวลาเข้าเวร</span>;

    const netMs = Math.max(0, diff);

    const hours = Math.floor(netMs / (1000 * 60 * 60));
    const minutes = Math.floor((netMs % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '0.9rem', marginTop: '0.5rem' }}>
        <strong>รวมเวลาสุทธิ:</strong> {hours} ชั่วโมง {minutes} นาที
      </div>
    );
  };

  return (
    <div className="modal-overlay personnel-modal-overlay">
      <div className="modal-content personnel-modal-content">
        <div className="modal-header">
          <h2>เพิ่มเวลาเข้าเวรย้อนหลัง</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
          <div className="personnel-avatar" style={{ padding: user.avatar_url ? 0 : undefined, width: '50px', height: '50px' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : getInitial(user.ic_name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1.1rem' }}>{user.ic_name}</div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{user.positions?.name || '-'}</div>
          </div>
        </div>

        <form onSubmit={onSave}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="modal-label">เวลาเข้าเวร (Clock In)</label>
            <DateTimeInput 
              value={dutyClockIn} 
              onChange={(date: any) => setDutyClockIn(date)} 
              placeholder="เลือกวันที่และเวลา"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="modal-label">เวลาออกเวร (Clock Out)</label>
            <DateTimeInput 
              value={dutyClockOut} 
              onChange={(date: any) => setDutyClockOut(date)} 
              placeholder="เลือกวันที่และเวลา"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            {calculateTotalDuration()}
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn cancel" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="modal-btn save" disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกเวลาเวร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
