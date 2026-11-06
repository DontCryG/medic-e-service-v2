import React, { useState } from 'react';
import { Clock, Filter, Pencil, Trash2 } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import { enterpriseSwal, showErrorAlert } from '@/utils/alert';
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import SmartSelect from '../../../components/common/SmartSelect';
import { formatDateString, getDutyBadgeInfo } from '../utils/dutyUtils';
import EditDutyModal from './EditDutyModal';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface DoctorOption {
  discord_id: string;
  ic_name: string;
}

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
  isAdmin?: boolean;
  doctors?: DoctorOption[];
  selectedDoctorId?: string;
  onDoctorChange?: (id: string) => void;
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
  onPageChange,
  isAdmin = false,
  doctors = [],
  selectedDoctorId = '',
  onDoctorChange
}: DutyHistoryTableProps) {
  const queryClient = useQueryClient();
  const [editingLog, setEditingLog] = useState<any>(null);

  const handleDelete = async (id: string) => {
    const result = await enterpriseSwal.fire({
      title: 'ลบประวัติเวร?',
      text: 'คุณต้องการลบประวัติเวรนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบทิ้ง',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('duty_logs').delete().eq('id', id);
        if (error) throw error;
        toast.success('ลบประวัติเวรสำเร็จ');
        queryClient.invalidateQueries({ queryKey: ['duty'] });
        queryClient.invalidateQueries({ queryKey: ['salary'] });
      } catch (err: any) {
        showErrorAlert('เกิดข้อผิดพลาด', err.message);
      }
    }
  };

  const doctorOptions = [
    { value: '', label: 'ของฉัน (ค่าเริ่มต้น)' },
    { value: 'all', label: 'แพทย์ทุกคน (ทั้งหมด)' },
    ...doctors.map(d => ({ value: d.discord_id, label: d.ic_name }))
  ];

  const colSpanCount = isAdmin ? 6 : 4;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
      {editingLog && (
        <EditDutyModal 
          log={editingLog} 
          onClose={() => setEditingLog(null)} 
        />
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <h3 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
          <Clock size={22} color="#7c3aed" /> 
          {isAdmin && selectedDoctorId === 'all' 
            ? 'ประวัติการเข้าเวร (แพทย์ทุกคน)' 
            : isAdmin && selectedDoctorId 
            ? `ประวัติการเข้าเวร (${doctors.find(d => d.discord_id === selectedDoctorId)?.ic_name || 'แพทย์ที่เลือก'})` 
            : 'ประวัติการเข้าเวรของคุณ'}
        </h3>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
          {isAdmin && onDoctorChange && (
            <div className="w-[180px]">
              <SmartSelect
                options={doctorOptions}
                value={selectedDoctorId}
                onChange={onDoctorChange}
                placeholder="เลือกแพทย์"
                searchable={true}
              />
            </div>
          )}

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
        <table className="w-full min-w-[750px] border-collapse text-left">
          <thead>
            <tr>
              {isAdmin && (
                <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">ชื่อแพทย์</th>
              )}
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">วันที่เข้าเวร / ที่มา</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">เวลาออกเวร</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">พักเบรก (นาที)</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">รวมเวลา</th>
              {isAdmin && (
                <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200 text-center">จัดการ</th>
              )}
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

              const badge = getDutyBadgeInfo(log.duty_type, log.granted_by);
              
              return (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  {isAdmin && (
                    <td className="p-4 text-slate-800 font-medium">
                      <div>{log.users?.ic_name || '-'}</div>
                      <div className="text-xs text-slate-400">{log.users?.positions?.name || ''}</div>
                    </td>
                  )}
                  <td className="p-4 text-slate-700 text-[0.95rem]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{formatDateString(log.clock_in)}</span>
                      {badge && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-700 text-[0.95rem]">{formatDateString(log.clock_out)}</td>
                  <td className="p-4 text-slate-700 text-[0.95rem]">{breakMinutes}</td>
                  <td className="p-4 text-slate-800 font-bold">{formattedTime}</td>
                  {isAdmin && (
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingLog(log)}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border-none cursor-pointer"
                          title="แก้ไขประวัติเวร"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border-none cursor-pointer"
                          title="ลบประวัติเวร"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={colSpanCount} className="p-4">
                  <EmptyState
                    title="ยังไม่มีประวัติการเข้าเวร"
                    description="ประวัติการปฏิบัติหน้าที่ของแพทย์จะแสดงที่นี่เมื่อเริ่มงาน"
                  />
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
