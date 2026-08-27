import { useState } from 'react';
import { ClipboardList, Users, PlusCircle, Search } from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Real-time synchronization
  useLeaveRealtime();

  // Queries
  const { data: myLeavesData = [], isLoading: loadingMyLeaves } = useMyLeaves(profile?.discord_id);
  const myLeaves = myLeavesData.filter((l: any) => statusFilter === "all" || l.status === statusFilter);
  const { data: allLeaves = [], isLoading: loadingAllLeaves } = useAllLeaves();

  // Filter leaves
  const filteredAllLeaves = allLeaves.filter((leave: any) => {
    const matchesSearch = !searchQuery || 
      leave.users?.ic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Roles that can manage leaves
  const isManager = profile?.role === 'admin' || profile?.role === 'director' || profile?.role === 'management';

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex bg-slate-100 p-1.5 rounded-[16px] w-full sm:w-fit overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('my_leaves')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
              activeTab === 'my_leaves'
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList size={18} />
            ประวัติการลาของฉัน
          </button>
          
          {isManager && (
            <button
              onClick={() => setActiveTab('manage_leaves')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-[0.95rem] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
                activeTab === 'manage_leaves'
                  ? 'bg-white text-[var(--primary)] shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={18} />
              จัดการคำขอลา
            </button>
          )}
        </div>

        {activeTab === 'my_leaves' && (
          <button 
            onClick={() => setShowRequestModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-semibold bg-[var(--primary)] hover:opacity-90 text-white transition-all border-none cursor-pointer w-full sm:w-auto"
          >
            <PlusCircle size={18} />
            ยื่นใบลา
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)]">
        {activeTab === 'my_leaves' ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 m-0">
                <ClipboardList size={24} className="text-[var(--primary)]" />
                ประวัติการลาของคุณ
              </h3>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-[14px] overflow-x-auto w-full md:w-auto border border-slate-200">
                <button 
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  รออนุมัติ
                </button>
                <button 
                  onClick={() => setStatusFilter('approved')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'approved' ? 'bg-green-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  อนุมัติแล้ว
                </button>
                <button 
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'rejected' ? 'bg-red-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  ปฏิเสธ
                </button>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'all' ? 'bg-white text-[var(--primary)] shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  ทั้งหมด
                </button>
                </div>
              </div>
              {loadingMyLeaves ? (
              <div className="text-center py-12 text-slate-400 font-medium">กำลังโหลดข้อม้ล...</div>
            ) : (
              <LeaveList leaves={myLeaves} isAdmin={false} />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-center flex-wrap gap-4 mb-2">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Users size={24} className="text-[var(--primary)] hidden sm:block" />
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-[14px] overflow-x-auto w-full md:w-auto border border-slate-200">
                  <button 
                    onClick={() => setStatusFilter('pending')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    รออนุมัติ
                  </button>
                  <button 
                    onClick={() => setStatusFilter('approved')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'approved' ? 'bg-green-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    อนุมัติแล้ว
                  </button>
                  <button 
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'rejected' ? 'bg-red-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    ปฏิเสธ
                  </button>
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-none cursor-pointer ${statusFilter === 'all' ? 'bg-white text-[var(--primary)] shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    ทั้งหมด
                  </button>
                </div>
              </div>
              <div className="relative w-full md:w-64">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรือเหตุผล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all !pl-10 !py-2.5"
                />
              </div>
            </div>

            {loadingAllLeaves ? (
              <div className="text-center py-12 text-slate-400 font-medium">กำลังโหลดข้อม้ล...</div>
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
