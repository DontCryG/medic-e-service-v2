import { memo } from 'react';
import { Users, Search, Edit2, Trash2, Clock } from 'lucide-react';
import { getInitial } from '../utils/personnelUtils';

export interface UserWithPosition {
  discord_id: string;
  ic_name: string;
  ic_phone?: string;
  avatar_url?: string;
  is_admin: boolean;
  role?: string;
  positions?: {
    id: string;
    name: string;
    rank: number;
    oc_rate: number;
  };
}

interface PersonnelTableProps {
  profile: any;
  filteredUsers: UserWithPosition[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  onEditClick: (user: UserWithPosition) => void;
  onAddDutyClick: (user: UserWithPosition) => void;
  onDeleteUser: (user: UserWithPosition) => Promise<void>;
}

const PersonnelTable = memo(function PersonnelTable({
  profile,
  filteredUsers,
  loading,
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  onEditClick,
  onAddDutyClick,
  onDeleteUser
}: PersonnelTableProps) {
  return (
    <>
      {/* Header & Controls */}
      <div className="personnel-header">
        <div className="personnel-search">
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="ค้นหาด้วยชื่อ IC..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="personnel-tabs">
          <button className={`personnel-tab-btn ${filterRole === 'all' ? 'active all' : ''}`} onClick={() => setFilterRole('all')}>ทั้งหมด</button>
          <button className={`personnel-tab-btn ${filterRole === 'admin' ? 'active admin' : ''}`} onClick={() => setFilterRole('admin')}>แอดมิน (Admin)</button>
          <button className={`personnel-tab-btn ${filterRole === 'medic' ? 'active medic' : ''}`} onClick={() => setFilterRole('medic')}>แพทย์ (Medic)</button>
          <button className={`personnel-tab-btn ${filterRole === 'user' ? 'active' : ''}`} onClick={() => setFilterRole('user')}>บุคคลทั่วไป (User)</button>
          <button className={`personnel-tab-btn ${filterRole === 'resigned' ? 'active' : ''}`} onClick={() => setFilterRole('resigned')} style={filterRole === 'resigned' ? {backgroundColor: '#fef2f2', color: '#ef4444', borderColor: '#ef4444'} : {}}>พ้นสภาพ</button>
        </div>
      </div>

      {/* Table Card */}
      <div className="personnel-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: '#ea580c' }}>
          <Users size={28} /> ทะเบียนบุคลากรแพทย์
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="personnel-table">
              <thead>
                <tr>
                  <th>ข้อมูลบุคลากร (IC)</th>
                  <th>ตำแหน่ง (Position)</th>
                  <th>สิทธิ์ (Role)</th>
                  <th>Discord ID</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user.discord_id}>
                    <td>
                      <div className="personnel-user">
                        <div className="personnel-avatar" style={{ padding: user.avatar_url ? 0 : undefined }}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : getInitial(user.ic_name)}
                        </div>
                        <div>
                          <div className="personnel-name">{user.ic_name}</div>
                          <div className="personnel-phone">{user.ic_phone || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.positions?.name || '-'}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{user.discord_id}</td>
                    <td>
                      <div className="personnel-actions">
                        <button className="action-btn edit" onClick={() => onEditClick(user)} title="แก้ไขข้อมูล">
                          <Edit2 size={18} />
                        </button>
                        <button className="action-btn add-duty" onClick={() => onAddDutyClick(user)} title="เพิ่มเวลาเวรย้อนหลัง">
                          <Clock size={18} />
                        </button>
                        {user.discord_id !== profile?.discord_id && (
                          <button className="action-btn delete" onClick={() => onDeleteUser(user)} title="พ้นสภาพ">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                          <Search size={32} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#475569', fontSize: '1.1rem' }}>ไม่พบข้อมูลบุคลากร</p>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>ลองเปลี่ยนคำค้นหาหรือตัวกรองบทบาท</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
});

export default PersonnelTable;
