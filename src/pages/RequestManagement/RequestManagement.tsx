import { useState } from 'react';
import { useGeneralRequests } from './hooks/useRequestQueries';
import { useRequestRealtime } from './hooks/useRequestRealtime';
import { useAuthStore } from '@/store/authStore';
import RequestList from './components/RequestList';
import CreateRequestModal from './components/CreateRequestModal';
import { PlusCircle, Inbox, Clock, CheckCircle, XCircle } from 'lucide-react';
import '../RequestManagement.css';

export function RequestManagement() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'director' || user?.role === 'management';
  
  // Connect Realtime
  useRequestRealtime();

  const { data: requests = [], isLoading } = useGeneralRequests();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter requests
  const filteredRequests = requests.filter(req => req.status === activeTab);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="req-admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Inbox size={32} color="var(--primary)" />
            ระบบจัดการคำร้อง
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? 'ตรวจสอบและพิจารณาคำร้องจากบุคลากร' : 'ยื่นคำร้องและติดตามสถานะคำร้องของคุณ'}
          </p>
        </div>
        
        {!isAdmin && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            <PlusCircle size={20} />
            ยื่นคำร้องใหม่
          </button>
        )}
      </div>

      <div className="req-admin-tabs">
        <button 
          className={`req-admin-tab-btn ${activeTab === 'pending' ? 'active pending' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={18} /> รอตรวจสอบ ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`req-admin-tab-btn ${activeTab === 'approved' ? 'active approved' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <CheckCircle size={18} /> อนุมัติแล้ว ({requests.filter(r => r.status === 'approved').length})
        </button>
        <button 
          className={`req-admin-tab-btn ${activeTab === 'rejected' ? 'active rejected' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          <XCircle size={18} /> ปฏิเสธ ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      <div className="req-admin-card" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <RequestList requests={filteredRequests} isAdmin={isAdmin} />
      </div>

      {isCreateModalOpen && (
        <CreateRequestModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
