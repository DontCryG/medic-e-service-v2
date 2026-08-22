import { Check, X, Clock, User, FileText, Trash2, MessageSquare } from 'lucide-react';
import { useUpdateRequestStatus, useDeleteRequest } from '../hooks/useRequestMutations';
import Swal from 'sweetalert2';

interface RequestListProps {
  requests: any[];
  isAdmin: boolean;
}

export default function RequestList({ requests, isAdmin }: RequestListProps) {
  const updateStatusMutation = useUpdateRequestStatus();
  const deleteRequestMutation = useDeleteRequest();

  const handleApprove = async (id: string) => {
    if (updateStatusMutation.isPending || deleteRequestMutation.isPending) return;
    updateStatusMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = async (id: string) => {
    if (updateStatusMutation.isPending || deleteRequestMutation.isPending) return;
    const { value: comment } = await Swal.fire({
      title: 'เหตุผลที่ปฏิเสธ',
      input: 'textarea',
      inputPlaceholder: 'กรอกเหตุผลที่ปฏิเสธคำร้อง...',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });

    if (comment !== undefined) {
      updateStatusMutation.mutate({ id, status: 'rejected', adminComment: comment });
    }
  };

  const handleDelete = async (id: string) => {
    if (updateStatusMutation.isPending || deleteRequestMutation.isPending) return;
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณต้องการลบคำร้องนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#ef4444'
    });
    
    if (result.isConfirmed) {
      deleteRequestMutation.mutate(id);
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

  if (requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        ไม่มีประวัติคำร้อง
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {requests.map((req) => (
        <div key={req.id} style={{ 
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
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {req.title}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <User size={14} />
                    <span>{req.users?.ic_name || 'Unknown'} ({req.users?.positions?.name || 'Unknown'})</span>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {getStatusBadge(req.status)}
              
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {req.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleApprove(req.id)}
                        disabled={updateStatusMutation.isPending || deleteRequestMutation.isPending}
                        style={{ padding: '6px', borderRadius: '6px', background: '#dcfce7', color: '#166534', border: 'none', cursor: updateStatusMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: updateStatusMutation.isPending ? 0.5 : 1 }}
                        title="อนุมัติ"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleReject(req.id)}
                        disabled={updateStatusMutation.isPending || deleteRequestMutation.isPending}
                        style={{ padding: '6px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: updateStatusMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: updateStatusMutation.isPending ? 0.5 : 1 }}
                        title="ไม่อนุมัติ"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDelete(req.id)}
                    disabled={updateStatusMutation.isPending || deleteRequestMutation.isPending}
                    style={{ padding: '6px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', border: 'none', cursor: deleteRequestMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleteRequestMutation.isPending ? 0.5 : 1 }}
                    title="ลบคำร้อง"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              {!isAdmin && req.status === 'pending' && (
                <button 
                  onClick={() => handleDelete(req.id)}
                  style={{ padding: '6px 12px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
                  title="ยกเลิกคำร้องนี้"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {req.description}
          </div>

          {req.status === 'rejected' && req.admin_comment && (
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.9rem' }}>
              <MessageSquare size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>เหตุผลที่ถูกปฏิเสธ:</strong> {req.admin_comment}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            <Clock size={14} />
            ยื่นเรื่องเมื่อ: {new Date(req.created_at).toLocaleString('th-TH')}
          </div>
        </div>
      ))}
    </div>
  );
}
