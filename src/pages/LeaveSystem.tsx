import { useState } from 'react';
import { ClipboardList, Users, PlusCircle, Search, CalendarDays } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { isAdmin } from '@/utils/permissions';

import { useMyLeaves, useAllLeaves } from './LeaveSystem/hooks/useLeaveQueries';
import { useLeaveRealtime } from './LeaveSystem/hooks/useLeaveRealtime';
import LeaveList from './LeaveSystem/components/LeaveList';
import LeaveRequestModal from './LeaveSystem/components/LeaveRequestModal';
import TableSkeleton from '@/components/common/TableSkeleton';

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

  const isManager = isAdmin(profile?.role);

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      <PageHeader
        title="ระบบลางาน (Leave System)"
        subtitle="ส่งคำขอลาพักร้อน ลากิจ และติดตามสถานะการอนุมัติคำขอ"
        icon={<CalendarDays size={18} />}
        iconTheme="purple"
        actions={
          activeTab === 'my_leaves' ? (
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors border-none cursor-pointer shadow-2xs"
            >
              <PlusCircle size={15} />
              ยื่นใบลา
            </button>
          ) : undefined
        }
      />
      
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto max-w-full border border-slate-200/80">
          <button
            onClick={() => setActiveTab('my_leaves')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors whitespace-nowrap ${
              activeTab === 'my_leaves'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList size={15} />
            ประวัติการลาของฉัน
          </button>
          
          {isManager && (
            <button
              onClick={() => setActiveTab('manage_leaves')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors whitespace-nowrap ${
                activeTab === 'manage_leaves'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={15} />
              จัดการคำขอลา
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200/80">
        {activeTab === 'my_leaves' ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <ClipboardList size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 m-0">
                  ประวัติการลาของคุณ
                </h3>
              </div>

              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg overflow-x-auto w-full sm:w-auto border border-slate-200/80">
                <button 
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-400 text-amber-950 shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  รออนุมัติ
                </button>
                <button 
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  อนุมัติแล้ว
                </button>
                <button 
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  ปฏิเสธ
                </button>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'all' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  ทั้งหมด
                </button>
              </div>
            </div>

            {loadingMyLeaves ? (
              <div className="py-4">
                <TableSkeleton columns={4} rows={3} />
              </div>
            ) : (
              <LeaveList leaves={myLeaves} isAdmin={false} />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg overflow-x-auto w-full sm:w-auto border border-slate-200/80">
                  <button 
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-400 text-amber-950 shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    รออนุมัติ
                  </button>
                  <button 
                    onClick={() => setStatusFilter('approved')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    อนุมัติแล้ว
                  </button>
                  <button 
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'rejected' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    ปฏิเสธ
                  </button>
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border-none cursor-pointer ${statusFilter === 'all' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    ทั้งหมด
                  </button>
                </div>
              </div>

              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรือเหตุผล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full !pl-8.5 !pr-3 !py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-medium"
                />
              </div>
            </div>

            {loadingAllLeaves ? (
              <div className="py-4">
                <TableSkeleton columns={5} rows={4} />
              </div>
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
