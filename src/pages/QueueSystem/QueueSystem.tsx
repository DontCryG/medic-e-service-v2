import { useState } from 'react';
import { History, RefreshCw, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useQueue } from './hooks/useQueue';
import { useQueueMutations } from './hooks/useQueueMutations';
import { QueueRow } from './components/QueueRow';
import { HistoryModal } from './components/HistoryModal';
import './QueueSystem.css';
import './QueueModal.css'; // Add this for Modal styles

export function QueueSystem() {
  const { user } = useAuthStore();
  const { queueUsers, isLoading, realtimeConnected, error } = useQueue(user?.discord_id);
  const { addVolunteer } = useQueueMutations();
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [volunteerName, setVolunteerName] = useState('');
  
  const handleAddVolunteer = async () => {
    if (!volunteerName.trim()) return;
    await addVolunteer(volunteerName.trim());
    setVolunteerName('');
  };

  const storyLockedUsers = queueUsers.filter(u => u.status_record?.status === 'story' && u.status_record?.story_locked === true);
  const mainQueueUsers = queueUsers.filter(u => !(u.status_record?.status === 'story' && u.status_record?.story_locked === true));

  return (
    <div className="queue-container">
      <div className="queue-header">
        <div>
          <h1 className="queue-title">ระบบจัดการคิว (Queue System)</h1>
          <p className="queue-subtitle">
            แสดงสถานะหมอที่กำลังเข้าเวรปัจจุบัน 
            <span style={{ marginLeft: '8px', color: realtimeConnected ? '#10b981' : '#ef4444' }}>
              ● {realtimeConnected ? 'เชื่อมต่อแล้ว (Realtime)' : 'ขาดการเชื่อมต่อ (Offline)'}
            </span>
          </p>
        </div>
        <div className="queue-header-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="ชื่อหมออาสา" 
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddVolunteer()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                width: '180px'
              }}
            />
            <button 
              onClick={handleAddVolunteer}
              disabled={!volunteerName.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: volunteerName.trim() ? 'pointer' : 'not-allowed',
                opacity: volunteerName.trim() ? 1 : 0.6,
                fontWeight: 500
              }}
            >
              <UserPlus size={18} />
              เพิ่มอาสา
            </button>
          </div>
          <button className="history-btn" onClick={() => setIsHistoryOpen(true)}>
            <History size={18} />
            ประวัติการจัดการ
          </button>
        </div>
      </div>

      <div className="queue-card">
        <div className="queue-table-wrapper">
          <table className="queue-table">
            <thead>
              <tr>
                <th className="col-name">รายชื่อ</th>
                <th className="col-unavailable">ไม่สะดวก</th>
                <th className="col-queued">คิว</th>
                <th className="col-manager">หมอรันคิว</th>
                <th className="col-story">สตอรี่</th>
                <th className="col-story-time">รายละเอียดสตอรี่</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <RefreshCw className="animate-spin" />
                      <span>กำลังโหลดข้อมูลบุคลากร...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                    เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
                  </td>
                </tr>
              ) : mainQueueUsers.length > 0 ? (
                mainQueueUsers.map(queueUser => (
                  <QueueRow key={queueUser.discord_id} user={queueUser} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    ไม่มีข้อมูลผู้เล่นในคิว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {storyLockedUsers.length > 0 && (
        <div className="queue-card" style={{ marginTop: '24px', borderTop: '4px solid #f43f5e' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e11d48', margin: 0 }}>
              คิวสตอรี่ (Story Queue)
            </h2>
            <span style={{ marginLeft: '12px', padding: '4px 10px', backgroundColor: '#e11d48', color: 'white', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
              {storyLockedUsers.length} คน
            </span>
          </div>
          <div className="queue-table-wrapper">
            <table className="queue-table">
              <thead>
                <tr>
                  <th className="col-name">ชื่อผู้เล่น</th>
                  <th className="col-story">สตอรี่</th>
                  <th className="col-story-time">รายละเอียดสตอรี่</th>
                </tr>
              </thead>
              <tbody>
                {storyLockedUsers.map(queueUser => (
                  <QueueRow key={queueUser.discord_id} user={queueUser} isStoryQueue={true} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        isAdmin={user?.role === 'admin'}
      />
    </div>
  );
}
