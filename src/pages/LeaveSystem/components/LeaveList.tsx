import { Check, X, Clock, User, Calendar, FileText, Trash2 } from 'lucide-react';
import { useUpdateLeaveStatus, useDeleteLeave } from '../hooks/useLeaveMutations';
import Swal from 'sweetalert2';

interface LeaveListProps {
  leaves: any[];
  isAdmin: boolean;
}

export default function LeaveList({ leaves, isAdmin }: LeaveListProps) {
  const updateStatusMutation = useUpdateLeaveStatus();
  const deleteLeaveMutation = useDeleteLeave();

  const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDeleteLeave = async (id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการยกเลิก?',
      text: 'คุณต้องการยกเลิกการลานี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#ef4444'
    });
    
    if (result.isConfirmed) {
      deleteLeaveMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>อนุมัติแล้ว</span>;
      case 'rejected':
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: '#fee2e2', color: '#991b1b' }}>ปฏิเสธ</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>รอตรวจสอบ</span>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'leave': return 'ลางาน';
      case 'vacation': return 'ลาพักร้อน';
      case 'resign': return 'ลาออก';
      default: return 'อื่นๆ';
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
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        ไม่มีประวัติการลางาน
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {leaves.map((leave) => (
        <div key={leave.id} style={{ 
          background: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            
            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{leave.users?.ic_name || 'ไม่ทราบชื่อ'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{leave.users?.positions?.name || 'ไม่ทราบตำแหน่ง'}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getLeaveTypeLabel(leave.leave_type)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {getStatusBadge(leave.status)}
              
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {leave.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(leave.id, 'approved')}
                        style={{ padding: '6px', borderRadius: '6px', background: '#dcfce7', color: '#166534', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="อนุมัติ"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(leave.id, 'rejected')}
                        style={{ padding: '6px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="ไม่อนุมัติ"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDeleteLeave(leave.id)}
                    style={{ padding: '6px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="ลบข้อมูลการลา"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              {!isAdmin && leave.status === 'pending' && (
                <button 
                  onClick={() => handleDeleteLeave(leave.id)}
                  style={{ padding: '6px 12px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                  title="ยกเลิกการลานี้"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '8px', marginTop: '0.5rem' }}>
              <Calendar size={16} color="var(--text-tertiary)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>ประเภท:</strong> {getLeaveTypeLabel(leave.leave_type)} &nbsp; | &nbsp;
                <strong>ระยะเวลา:</strong> {formatDate(leave.start_date)} ถึง {formatDate(leave.end_date)}
              </span>
            </div>
          )}
          
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', border: '1px solid #e2e8f0' }}>
            <FileText size={18} color="#64748b" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>เหตุผลการลา:</div>
              <div style={{ fontSize: '0.95rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                {leave.reason || '-'}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            <Clock size={14} />
            ยื่นเรื่องเมื่อ: {new Date(leave.created_at).toLocaleString('th-TH')}
          </div>
        </div>
      ))}
    </div>
  );
}
