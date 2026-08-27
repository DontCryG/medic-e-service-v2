import { useRef } from 'react';
import { Check, X, Clock, Calendar, FileText, Trash2 } from 'lucide-react';
import { useUpdateLeaveStatus, useDeleteLeave } from '../hooks/useLeaveMutations';
import Swal from 'sweetalert2';
import { getInitial } from '../../PersonnelSystem/utils/personnelUtils';

interface LeaveListProps {
  leaves: any[];
  isAdmin: boolean;
}

export default function LeaveList({ leaves, isAdmin }: LeaveListProps) {
  const updateStatusMutation = useUpdateLeaveStatus();
  const deleteLeaveMutation = useDeleteLeave();
  const processingRef = useRef(false);

  const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
    if (processingRef.current) return;
    processingRef.current = true;
    updateStatusMutation.mutate({ id, status }, {
      onSettled: () => { processingRef.current = false; }
    });
  };

  const handleDeleteLeave = async (id: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    const result = await Swal.fire({
      title: 'ยืนยันการลบคำขอ?',
      text: 'คุณต้องการลบคำขอลานี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
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
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">อนุมัติแล้ว</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">ปฏิเสธ</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">รออนุมัติ</span>;
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
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (leaves.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
        ไม่พบข้อมูลการลา
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {leaves.map((leave) => (
        <div key={leave.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-[0.95rem] overflow-hidden flex-shrink-0" style={{ padding: leave.users?.avatar_url ? 0 : undefined }}>
                  {leave.users?.avatar_url ? (
                    <img src={leave.users.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitial(leave.users?.ic_name || '')
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{leave.users?.ic_name || 'ไม่ทราบชื่อ'}</div>
                  <div className="text-sm text-slate-500">{leave.users?.positions?.name || 'ไม่ระบุตำแหน่ง'}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600 flex-shrink-0">
                  <Calendar size={22} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{getLeaveTypeLabel(leave.leave_type)}</div>
                  <div className="text-sm text-slate-500">
                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {getStatusBadge(leave.status)}
              
              {isAdmin && (
                <div className="flex gap-2">
                  {leave.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(leave.id, 'approved')}
                        disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                        className={`p-2.5 !min-h-0 aspect-square rounded-xl border border-slate-200 text-green-600 bg-white hover:bg-green-50 hover:border-green-300 transition-colors flex items-center justify-center cursor-pointer ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                        title="อนุมัติ"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(leave.id, 'rejected')}
                        disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                        className={`p-2.5 !min-h-0 aspect-square rounded-xl border border-slate-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center cursor-pointer ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                        title="ปฏิเสธ"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDeleteLeave(leave.id)}
                    disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                    className={`p-2.5 !min-h-0 aspect-square rounded-xl border border-slate-200 text-slate-500 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors flex items-center justify-center cursor-pointer ${deleteLeaveMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    title="ลบข้อมูล"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              {!isAdmin && leave.status === 'pending' && (
                <button 
                  onClick={() => handleDeleteLeave(leave.id)}
                  disabled={updateStatusMutation.isPending || deleteLeaveMutation.isPending}
                  className={`px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors border border-red-200 ${deleteLeaveMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-slate-50 rounded-xl mt-1 text-sm text-slate-600 border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-slate-400" />
                <strong>ประเภท:</strong> {getLeaveTypeLabel(leave.leave_type)}
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div>
                <strong>วันที่:</strong> {formatDate(leave.start_date)} ถืง {formatDate(leave.end_date)}
              </div>
            </div>
          )}
          
          <div className="p-4 bg-slate-50 rounded-xl flex gap-3 items-start border border-slate-200">
            <FileText size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1">เหตุผลการลา:</div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {leave.reason || '-'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={14} />
            ยื่นเมื่อ: {new Date(leave.created_at).toLocaleString('th-TH')}
          </div>
        </div>
      ))}
    </div>
  );
}
