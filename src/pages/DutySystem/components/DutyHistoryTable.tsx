import React from 'react';
import { Clock, Filter, Inbox } from 'lucide-react';
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import { formatDateString } from '../utils/dutyUtils';

interface DutyHistoryTableProps {
  history: any[];
  historyTotal: number;
  historyPage: number;
  itemsPerPage: number;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
}

const DutyHistoryTable = React.memo(function DutyHistoryTable({
  history,
  historyTotal,
  historyPage,
  itemsPerPage,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  onPageChange
}: DutyHistoryTableProps) {
  return (
    <div className="duty-card">
      <div className="duty-card-header">
        <h3 className="duty-card-title"><Clock size={22} color="#7c3aed" /> ประวัติการเข้าเวรของคุณ</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Filter size={18} color="var(--text-secondary)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ตั้งแต่:</span>
            <SmartDatePicker 
              selected={startDate} 
              onChange={onStartDateChange} 
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="filter-input"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ถึง:</span>
            <SmartDatePicker 
              selected={endDate} 
              onChange={onEndDateChange} 
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              className="filter-input"
            />
          </div>
          <button 
            onClick={onClearFilters}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ดูทั้งหมด
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="duty-table">
          <thead>
            <tr>
              <th>วันที่เข้าเวร</th>
              <th>เวลาออกเวร</th>
              <th>พักเบรก (นาที)</th>
              <th>รวมเวลา</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? history.map(log => {
              const breakMinutes = Math.floor(log.total_break_minutes || 0);
              const displayMinutes = Math.max(0, log.total_duty_minutes || 0);
              const hours = Math.floor(displayMinutes / 60);
              const minutes = displayMinutes % 60;
              
              let formattedTime = '';
              if (hours > 0) {
                formattedTime += `${hours} ชม. `;
              }
              formattedTime += `${minutes} นาที`;

              let badge = null;
              if (log.duty_type === 'exam_doctor') {
                badge = <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#3b82f6', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>สอบหมอใหม่</span>;
              } else if (log.duty_type === 'mentor') {
                badge = <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#ec4899', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>พี่เลี้ยง</span>;
              }
              
              return (
                <tr key={log.id}>
                  <td>
                    {formatDateString(log.clock_in)}
                    {badge}
                  </td>
                  <td>{formatDateString(log.clock_out)}</td>
                  <td>{breakMinutes}</td>
                  <td style={{ fontWeight: 600 }}>{formattedTime}</td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(241, 245, 249, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Inbox size={32} />
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#475569', fontSize: '1.1rem' }}>ยังไม่มีประวัติการเข้าเวร</p>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8' }}>ประวัติการเข้าเวรของคุณจะแสดงที่นี่เมื่อคุณเริ่มงาน</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {historyTotal > itemsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => onPageChange(Math.max(1, historyPage - 1))}
            disabled={historyPage === 1}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '6px',
              background: historyPage === 1 ? 'var(--bg-color)' : 'var(--surface-color)', 
              color: historyPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)', 
              border: '1px solid var(--border-color)',
              cursor: historyPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ก่อนหน้า
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            หน้า {historyPage} จาก {Math.ceil(historyTotal / itemsPerPage)}
          </span>
          <button 
            onClick={() => onPageChange(Math.min(Math.ceil(historyTotal / itemsPerPage), historyPage + 1))}
            disabled={historyPage >= Math.ceil(historyTotal / itemsPerPage)}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '6px',
              background: historyPage >= Math.ceil(historyTotal / itemsPerPage) ? 'var(--bg-color)' : 'var(--surface-color)', 
              color: historyPage >= Math.ceil(historyTotal / itemsPerPage) ? 'var(--text-tertiary)' : 'var(--text-primary)', 
              border: '1px solid var(--border-color)',
              cursor: historyPage >= Math.ceil(historyTotal / itemsPerPage) ? 'not-allowed' : 'pointer'
            }}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
});

export default DutyHistoryTable;
