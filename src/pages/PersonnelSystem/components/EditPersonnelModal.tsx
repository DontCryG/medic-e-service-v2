import { X, ShieldAlert } from 'lucide-react';
import { getInitial } from '../utils/personnelUtils';
import SmartSelect from '../../../components/common/SmartSelect';

export default function EditPersonnelModal({
  user,
  editRole,
  setEditRole,
  editPosition,
  setEditPosition,
  availablePositions,
  isSaving,
  onClose,
  onSave
}: {
  user: any;
  editRole: string;
  setEditRole: (role: string) => void;
  editPosition: string;
  setEditPosition: (pos: string) => void;
  availablePositions: any[];
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {

  return (
    <div className="modal-overlay personnel-modal-overlay">
      <div className="modal-content personnel-modal-content">
        <div className="modal-header">
          <h2>แก้ไขข้อมูลบุคลากร</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
          <div className="personnel-avatar" style={{ padding: user.avatar_url ? 0 : undefined, width: '50px', height: '50px' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : getInitial(user.ic_name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e293b' }}>{user.ic_name}</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Discord ID: {user.discord_id}</div>
          </div>
        </div>

        <div className="modal-form-group">
          <label>สิทธิ์การใช้งาน (Role)</label>
          <SmartSelect
            value={editRole}
            onChange={setEditRole}
            options={[
              { value: 'user', label: 'User (ประชาชน/ผู้ใช้งานทั่วไป)' },
              { value: 'medic', label: 'Medic (เจ้าหน้าที่แพทย์)' },
              { value: 'admin', label: 'Admin (ผู้ดูแลระบบ)' },
              { value: 'resigned', label: 'Resigned (ลาออก/ปลด)' }
            ]}
          />
        </div>

        <div className="modal-form-group">
          <label>ตำแหน่ง (Position)</label>
          <SmartSelect
            value={editPosition}
            onChange={setEditPosition}
            searchable={true}
            placeholder="เลือกตำแหน่ง..."
            options={availablePositions.map(pos => ({
              value: pos.id,
              label: pos.name
            }))}
          />
        </div>

        {(editRole === 'user' || editRole === 'resigned') && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#b91c1c', fontSize: '0.85rem', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span><strong>คำเตือน:</strong> การเปลี่ยนสิทธิ์เป็น User/Resigned จะทำให้ผู้ใช้งานคนนี้ไม่สามารถเข้าถึงระบบได้อีก (Access Denied)</span>
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose} disabled={isSaving}>ยกเลิก</button>
          <button className="modal-btn save" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </div>
    </div>
  );
}
