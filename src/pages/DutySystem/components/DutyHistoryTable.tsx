import React, { useState } from 'react';
import { Clock, Filter, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
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
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col">
      {editingLog && (
        <EditDutyModal 
          log={editingLog} 
          onClose={() => setEditingLog(null)} 
        />
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 m-0">
            {isAdmin && selectedDoctorId === 'all' 
              ? 'ประวัติการเข้าเวร (แพทย์ทุกคน)' 
              : isAdmin && selectedDoctorId 
              ? `ประวัติการเข้าเวร (${doctors.find(d => d.discord_id === selectedDoctorId)?.ic_name || 'แพทย์ที่เลือก'})` 
              : 'ประวัติการเข้าเวรของคุณ'}
          </h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto xl:justify-end text-xs">
          {isAdmin && onDoctorChange && (
            <div className="w-[170px]">
              <SmartSelect
                options={doctorOptions}
                value={selectedDoctorId}
                onChange={onDoctorChange}
                placeholder="เลือกแพทย์"
                searchable={true}
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <span className="text-slate-500">ตั้งแต่:</span>
            <SmartDatePicker 
              selected={startDate} 
              onChange={onStartDateChange} 
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="w-[115px] px-2.5 py-1 border border-slate-200/80 rounded-lg text-xs text-center outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">ถึง:</span>
            <SmartDatePicker 
              selected={endDate} 
              onChange={onEndDateChange} 
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              className="w-[115px] px-2.5 py-1 border border-slate-200/80 rounded-lg text-xs text-center outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <button 
            onClick={onClearFilters}
            className="px-2.5 py-1 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            ดูทั้งหมด
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80">
              {isAdmin && (
                <th className="p-3 text-slate-500 font-semibold text-[11px] border-b border-slate-200/70 uppercase tracking-wider">ชื่อแพทย์</th>
              )}
              <th className="p-3 text-slate-500 font-semibold text-[11px] border-b border-slate-200/70 uppercase tracking-wider">วันที่เข้าเวร / ที่มา</th>
              <th className="p-3 text-slate-500 font-semibold text-[11px] border-b border-slate-200/70 uppercase tracking-wider">เวลาออกเวร</th>
              <th className="p-3 text-slate-500 font-semibold text-[11px] border-b border-slate-200/70 uppercase tracking-wider">พักเบรก (นาที)</th>
              <th className="p-3 text-slate-500 font-semibold text-[11px] border-b border-slate-200/70 uppercase tracking-wider">รวมเวลา</th>
              {isAdmin && (
                <th className="p-3 text-slate-500 font-semibold text-[11px] border-b border-slate-200/70 uppercase tracking-wider text-center">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  {isAdmin && (
                    <td className="p-3 text-slate-800 font-medium">
                      <div className="font-semibold text-slate-800">{log.users?.ic_name || '-'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.2">{log.users?.positions?.name || ''}</div>
                    </td>
                  )}
                  <td className="p-3 text-slate-700">
                    <div className="flex flex-wrap items-center gap-1.5 font-mono">
                      <span>{formatDateString(log.clock_in)}</span>
                      {badge && (
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-semibold border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-slate-700 font-mono">{formatDateString(log.clock_out)}</td>
                  <td className="p-3 text-slate-700 font-mono">{breakMinutes}</td>
                  <td className="p-3 text-slate-900 font-bold">{formattedTime}</td>
                  {isAdmin && (
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingLog(log)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors border-none cursor-pointer"
                          title="แก้ไขประวัติเวร"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors border-none cursor-pointer"
                          title="ลบประวัติเวร"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={colSpanCount} className="p-6">
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
      
      {/* Pagination */}
      {historyTotal > itemsPerPage && (() => {
        const totalPages = Math.ceil(historyTotal / itemsPerPage);
        return (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 mt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-normal">
              แสดง <strong className="text-slate-700 font-semibold">{((historyPage - 1) * itemsPerPage) + 1}</strong> ถึง <strong className="text-slate-700 font-semibold">{Math.min(historyPage * itemsPerPage, historyTotal)}</strong> จาก <strong className="text-purple-700 font-bold">{historyTotal.toLocaleString()}</strong> รายการ
            </span>
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <button
                onClick={() => onPageChange(Math.max(1, historyPage - 1))}
                disabled={historyPage === 1}
                className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft size={14} />
              </button>
              
              {getPageNumbers(historyPage, totalPages).map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-1 text-slate-400 text-xs select-none">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => onPageChange(p as number)}
                    className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors border cursor-pointer ${
                      historyPage === p
                        ? 'bg-purple-600 border-purple-600 text-white shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}

              <button
                onClick={() => onPageChange(Math.min(totalPages, historyPage + 1))}
                disabled={historyPage >= totalPages}
                className="w-7 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                title="หน้าถัดไป"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
});

export default DutyHistoryTable;
