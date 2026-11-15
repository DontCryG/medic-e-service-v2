import { useRef } from 'react';
import { Check, X, Clock, Calendar, FileText, Trash2, CheckCircle2, XCircle, AlertCircle, UserCheck } from 'lucide-react';
import { useUpdateLeaveStatus, useDeleteLeave } from '../hooks/useLeaveMutations';
import { showConfirmDialog, enterpriseSwal } from '@/utils/alert';
import EmptyState from '@/components/common/EmptyState';
import { getInitial } from '../../PersonnelSystem/utils/personnelUtils';
import { useAuthStore } from '@/store/authStore';

interface LeaveListProps {
  leaves: any[];
  isAdmin: boolean;
}

export default function LeaveList({ leaves, isAdmin }: LeaveListProps) {
  const { user: currentUser } = useAuthStore();
  const updateStatusMutation = useUpdateLeaveStatus();
  const deleteLeaveMutation = useDeleteLeave();
  const processingRef = useRef(false);

  const handleApprove = async (leave: any) => {
    if (processingRef.current) return;
    const approverName = currentUser?.ic_name || 'ผู้ดูแลระบบ';
    const targetName = leave.users?.ic_name || 'บุคลากรท่านนี้';

    const result = await showConfirmDialog({
      title: 'อนุมัติการลา?',
      text: `ยืนยันการอนุมัติคำขอลาของ ${targetName} หรือไม่?`,
      icon: 'question',
      confirmButtonText: 'ยืนยันอนุมัติ',
      confirmButtonColor: '#16a34a'
    });

    if (result.isConfirmed) {
      processingRef.current = true;
      updateStatusMutation.mutate({
        id: leave.id,
        status: 'approved',
        approved_by: approverName
      }, {
        onSettled: () => { processingRef.current = false; }
      });
    }
  };

  const handleReject = async (leave: any) => {
    if (processingRef.current) return;
    const approverName = currentUser?.ic_name || 'ผู้ดูแลระบบ';
    const targetName = leave.users?.ic_name || 'บุคลากรท่านนี้';

    const { value: reason, isConfirmed } = await enterpriseSwal.fire({
      title: 'ระบุเหตุผลที่ไม่อนุมัติ',
      text: `ปฏิเสธคำขอลาของ ${targetName}`,
      input: 'textarea',
      inputPlaceholder: 'ระบุเหตุผลหรือข้อความแจ้งบุคลากร เช่น ติดภารกิจเวรเร่งด่วน, ยื่นกะทันหันเกินไป...',
      inputAttributes: {
        'aria-label': 'เหตุผลที่ไม่อนุมัติ'
      },
      showCancelButton: true,
      confirmButtonText: 'ยืนยันปฏิเสธ',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'กรุณาระบุเหตุผลการไม่อนุมัติ';
        }
      }
    });

    if (isConfirmed && reason) {
      processingRef.current = true;
      updateStatusMutation.mutate({
        id: leave.id,
        status: 'rejected',
        approved_by: approverName,
        admin_comment: reason.trim()
      }, {
        onSettled: () => { processingRef.current = false; }
      });
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    const result = await showConfirmDialog({
      title: 'ยืนยันการลบคำขอ?',
      text: 'คุณต้องการลบคำขอลานี้ใช่หรือไม่? ข้อมูลนี้ไม่สามารถกู้คืนได้',
      icon: 'warning',
      confirmButtonText: 'ยืนยันการลบ',
      confirmButtonColor: '#ef4444'
    });
    
    if (result.isConfirmed) {
      deleteLeaveMutation.mutate(id, {
        onSettled: () => { processingRef.current = false; }
      });
    } else {
      processingRef.current = false;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>อนุมัติแล้ว</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle size={13} className="text-rose-600" />
            <span>ไม่อนุมัติ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock size={13} className="text-amber-600" />
            <span>รอการอนุมัติ</span>
          </span>
        );
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'leave': return 'ลากิจ';
      case 'vacation': return 'ลาพักร้อน';
      case 'resign': return 'ลาออก';
      default: return 'ไม่ระบุ';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (leaves.length === 0) {
    return (
      <EmptyState
        title="ไม่พบข้อมูลการลา"
        description="ไม่มีรายการคำขอลาในช่วงสถานะหรือเงื่อนไขที่เลือก"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3.5">
      {leaves.map((leave) => (
        <div 
          key={leave.id} 
          className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs hover:shadow-xs transition-shadow"
        >
          {/* Card Top Row: Doctor info or Type info + Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                  {leave.users?.avatar_url ? (
                    <img src={leave.users.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    getInitial(leave.users?.ic_name || '')
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {leave.users?.ic_name || 'ไม่ทราบชื่อ'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    {leave.users?.positions?.name || 'ไม่ระบุตำแหน่ง'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    {getLeaveTypeLabel(leave.leave_type)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {formatDate(leave.start_date)} {leave.leave_type !== 'resign' && `ถึง ${formatDate(leave.end_date)}`}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              {getStatusBadge(leave.status)}
              
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  {leave.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleApprove(leave)}
                        disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                        className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                        title="อนุมัติการลา"
                      >
                        <Check size={15} />
                      </button>
                      <button 
                        onClick={() => handleReject(leave)}
                        disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                        className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                        title="ปฏิเสธการลา (ระบุเหตุผล)"
                      >
                        <X size={15} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDeleteLeave(leave.id)}
                    disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                    title="ลบคำขอลา"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {!isAdmin && leave.status === 'pending' && (
                <button 
                  onClick={() => handleDeleteLeave(leave.id)}
                  disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                  className="px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  ยกเลิกคำขอ
                </button>
              )}
            </div>
          </div>

          {/* Admin Context Info Bar (Leave Type & Dates) */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 bg-slate-50/80 rounded-lg text-xs text-slate-600 border border-slate-200/70">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                <span className="font-semibold text-slate-800">ประเภท:</span> {getLeaveTypeLabel(leave.leave_type)}
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div>
                <span className="font-semibold text-slate-800">ช่วงเวลา:</span> {formatDate(leave.start_date)} {leave.leave_type !== 'resign' && `ถึง ${formatDate(leave.end_date)}`}
              </div>
            </div>
          )}
          
          {/* Reason Box */}
          <div className="p-3 bg-slate-50/60 rounded-lg flex gap-2.5 items-start border border-slate-200/70 text-xs">
            <FileText size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-slate-500 mb-0.5">เหตุผลการลา:</div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                {leave.reason || '-'}
              </div>
            </div>
          </div>

          {/* Admin Rejection Reason or Approval Comment Banner */}
          {leave.status === 'rejected' && leave.admin_comment && (
            <div className="p-3 bg-rose-50/70 rounded-lg flex gap-2.5 items-start border border-rose-200/80 text-xs animate-in fade-in duration-150">
              <AlertCircle size={15} className="text-rose-600 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-rose-900 mb-0.5 flex items-center gap-1.5">
                  <span>เหตุผลที่ไม่อนุมัติ</span>
                  {leave.approved_by && (
                    <span className="font-normal text-rose-700">
                      (โดย: <strong>{leave.approved_by}</strong>)
                    </span>
                  )}
                </div>
                <div className="text-xs text-rose-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {leave.admin_comment}
                </div>
              </div>
            </div>
          )}

          {leave.status === 'approved' && leave.admin_comment && (
            <div className="p-3 bg-emerald-50/70 rounded-lg flex gap-2.5 items-start border border-emerald-200/80 text-xs animate-in fade-in duration-150">
              <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-emerald-900 mb-0.5">
                  หมายเหตุจากผู้บริหาร:
                </div>
                <div className="text-xs text-emerald-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {leave.admin_comment}
                </div>
              </div>
            </div>
          )}
          
          {/* Card Footer: Timestamp & Approver Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>ยื่นเมื่อ: {new Date(leave.created_at).toLocaleString('th-TH')}</span>
            </div>

            {/* Display Who Approved or Reviewed */}
            {leave.approved_by && (
              <div className="flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                <UserCheck size={12} className={leave.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'} />
                <span>
                  {leave.status === 'approved' ? 'อนุมัติโดย:' : 'พิจารณาโดย:'}{' '}
                  <strong className="text-slate-800">{leave.approved_by}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
