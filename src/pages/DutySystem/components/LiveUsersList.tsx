import { Activity, Play, Pause, Square } from 'lucide-react';

interface LiveUsersListProps {
  liveUsers: any[];
  profile: any;
  loading: boolean;
  onAdminToggleBreak: (user: any) => void;
  onAdminClockOut: (user: any) => void;
}

export default function LiveUsersList({ 
  liveUsers, 
  profile, 
  loading, 
  onAdminToggleBreak, 
  onAdminClockOut 
}: LiveUsersListProps) {
  

  return (
    <div className="duty-card">
      <div className="duty-card-header">
        <h3 className="duty-card-title"><Activity size={22} color="#7c3aed" /> กำลังเข้าเวร <span className="live-badge">LIVE</span></h3>
      </div>
      <div className="table-responsive">
        <table className="duty-table">
          <thead>
            <tr>
              <th>ชื่อแพทย์</th>
              <th>สถานะ</th>
              <th>เวลาเริ่ม</th>
              {profile.role === 'admin' && <th style={{ textAlign: 'right' }}>จัดการ (แอดมิน)</th>}
            </tr>
          </thead>
          <tbody>
            {liveUsers.length > 0 ? liveUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{user.users?.ic_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.users?.position}</div>
                </td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'on_duty' ? 'ปฏิบัติหน้าที่' : 'พักเบรก'}
                  </span>
                </td>
                <td>{new Date(user.clock_in).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                {profile.role === 'admin' && (
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="duty-btn btn-break" 
                        style={{ 
                          padding: '6px 16px', 
                          fontSize: '0.85rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          minWidth: '90px', 
                          justifyContent: 'center',
                          borderRadius: '9999px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'; }}
                        onClick={() => onAdminToggleBreak(user)}
                        disabled={loading}
                      >
                        {user.status === 'on_break' ? <><Play size={14} /> กลับ</> : <><Pause size={14} /> พัก</>}
                      </button>
                      <button 
                        className="duty-btn btn-clock-out" 
                        style={{ 
                          padding: '6px 16px', 
                          fontSize: '0.85rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          justifyContent: 'center',
                          borderRadius: '9999px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: 'white',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'; }}
                        onClick={() => onAdminClockOut(user)}
                        disabled={loading}
                      >
                        <Square size={14} /> ออกเวร
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={profile.role === 'admin' ? 4 : 3} style={{ textAlign: 'center', padding: '2rem' }}>ไม่มีผู้เข้าเวรในขณะนี้</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
