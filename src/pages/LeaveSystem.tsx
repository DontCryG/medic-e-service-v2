import { useState } from 'react';
import { ClipboardList, Users, PlusCircle, Search } from 'lucide-react';
import './LeaveSystem.css';

import { useMyLeaves, useAllLeaves } from './LeaveSystem/hooks/useLeaveQueries';
import { useLeaveRealtime } from './LeaveSystem/hooks/useLeaveRealtime';
import LeaveList from './LeaveSystem/components/LeaveList';
import LeaveRequestModal from './LeaveSystem/components/LeaveRequestModal';

export interface LeaveSystemProps {
  profile: any;
}

export default function LeaveSystem({ profile }: LeaveSystemProps) {
  const [activeTab, setActiveTab] = useState<'my_leaves' | 'manage_leaves'>('my_leaves');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time synchronization
  useLeaveRealtime();

  // Queries
  const { data: myLeaves = [], isLoading: loadingMyLeaves } = useMyLeaves(profile?.discord_id);
  const { data: allLeaves = [], isLoading: loadingAllLeaves } = useAllLeaves();

  // Filter leaves
  const filteredAllLeaves = allLeaves.filter((leave: any) => 
    !searchQuery || 
    leave.users?.ic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Roles that can manage leaves
  const isManager = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'management';

  return (
    <div className="" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('my_leaves')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'my_leaves' ? '#e0f2fe' : 'transparent',
              color: activeTab === 'my_leaves' ? '#0284c7' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <ClipboardList size={18} />
            ประวัติการลาของฉัน
          </button>
          
          {isManager && (
            <button
              onClick={() => setActiveTab('manage_leaves')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'manage_leaves' ? '#f3e8ff' : 'transparent',
                color: activeTab === 'manage_leaves' ? '#7e22ce' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <Users size={18} />
              จัดการคำขอลา
            </button>
          )}
        </div>

        {activeTab === 'my_leaves' && (
          <button 
            onClick={() => setShowRequestModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
            }}
          >
            <PlusCircle size={18} />
            ยื่นใบลางาน
          </button>
        )}
      </div>

      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        {activeTab === 'my_leaves' ? (
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={20} color="#3b82f6" />
              รายการคำขอลางานของคุณ
            </h3>
            {loadingMyLeaves ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</div>
            ) : (
              <LeaveList leaves={myLeaves} isAdmin={false} />
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#a855f7" />
                คำขอลางานทั้งหมดที่รอการตรวจสอบ
              </h3>
              
              <div style={{ position: 'relative', minWidth: '250px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้ลางาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {loadingAllLeaves ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</div>
            ) : (
              <LeaveList leaves={filteredAllLeaves} isAdmin={true} />
            )}
          </div>
        )}
      </div>

      {showRequestModal && (
        <LeaveRequestModal 
          profile={profile} 
          onClose={() => setShowRequestModal(false)} 
        />
      )}
    </div>
  );
}
