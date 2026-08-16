import { useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useQueue } from './hooks/useQueue';
import { QueueRow } from './components/QueueRow';
import { HistoryModal } from './components/HistoryModal';
import './QueueSystem.css';
import './QueueModal.css'; // Add this for Modal styles

export function QueueSystem() {
  const { user } = useAuthStore();
  const { queueUsers, isLoading, realtimeConnected, error } = useQueue(user?.discord_id);
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
        <div className="queue-header-actions">
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
              ) : queueUsers.length > 0 ? (
                queueUsers.map(queueUser => (
                  <QueueRow key={queueUser.discord_id} user={queueUser} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    ไม่มีบุคลากรเข้าเวรในขณะนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}
