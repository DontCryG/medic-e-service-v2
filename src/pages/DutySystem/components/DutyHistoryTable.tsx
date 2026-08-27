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
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <h3 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2"><Clock size={22} color="#7c3aed" /> ประวัติการเข้าเวรของคุณ</h3>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
          <Filter size={18} color="var(--text-secondary)" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">ตั้งแต่:</span>
            <SmartDatePicker 
              selected={startDate} 
              onChange={onStartDateChange} 
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="w-[130px] px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">ถึง:</span>
            <SmartDatePicker 
              selected={endDate} 
              onChange={onEndDateChange} 
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              className="w-[130px] px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-[var(--primary)]"
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
      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">วันที่เข้าเวร</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">เวลาออกเวร</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">พักเบรก (นาที)</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">รวมเวลา</th>
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
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-4 text-slate-700 text-[0.95rem]">
                    {formatDateString(log.clock_in)}
                    {badge}
                  </td>
                  <td className="p-4 text-slate-700 text-[0.95rem]">{formatDateString(log.clock_out)}</td>
                  <td className="p-4 text-slate-700 text-[0.95rem]">{breakMinutes}</td>
                  <td className="p-4 text-slate-800 font-bold">{formattedTime}</td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={4} className="text-center py-16 px-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Inbox size={32} />
                    </div>
                    <div>
                      <p className="m-0 mb-2 font-semibold text-slate-700 text-lg">ยังไม่มีประวัติการเข้าเวร</p>
                      <p className="m-0 text-sm text-slate-400">ประวัติการเข้าเวรของคุณจะแสดงที่นี่เมื่อคุณเริ่มงาน</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {historyTotal > itemsPerPage && (
        <div className="flex justify-center items-center gap-4 p-4 border-t border-slate-100 mt-4">
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
          <span className="text-sm text-slate-500">
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
