import { useState, useRef } from 'react';
import { History, UserPlus, Activity } from 'lucide-react';
import TableSkeleton from '@/components/common/TableSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useQueue } from './hooks/useQueue';
import { useQueueMutations } from './hooks/useQueueMutations';
import { QueueRow } from './components/QueueRow';
import { HistoryModal } from './components/HistoryModal';
import { isAdmin as checkIsAdmin } from '@/utils/permissions';

export function QueueSystem() {
  const { user } = useAuthStore();
  const { queueUsers, isLoading, realtimeConnected, error } = useQueue(user?.discord_id);
  const { addVolunteer } = useQueueMutations();
  
  const [volunteerName, setVolunteerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const processingRef = useRef(false); const handleAddVolunteer = async () => {
    if (!volunteerName.trim() || isProcessing || processingRef.current) return; processingRef.current = true;
    setIsProcessing(true);
    try {
      await addVolunteer(volunteerName.trim());
      setVolunteerName('');
    } finally {
      setIsProcessing(false); processingRef.current = false;
    }
  };

  const storyLockedUsers = queueUsers.filter(u => u.status_record?.status === 'story' && u.status_record?.story_locked === true);
  const mainQueueUsers = queueUsers.filter(u => !(u.status_record?.status === 'story' && u.status_record?.story_locked === true));

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50 min-h-full text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">ระบบจัดการคิว (Queue System)</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">
            แสดงสถานะหมอที่กำลังเข้าเวรปัจจุบัน 
            <span className={`ml-2 font-medium ${realtimeConnected ? 'text-emerald-600' : 'text-rose-500'}`}>
              ● {realtimeConnected ? 'ระบบเชื่อมต่อสด (Realtime)' : 'ขาดการเชื่อมต่อ (Offline)'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="ระบุชื่อแพทย์อาสา..." 
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddVolunteer()}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 w-44 transition-all placeholder:text-slate-400"
            />
            <button 
              onClick={(e) => { e.currentTarget.disabled = true; handleAddVolunteer(); }}
              disabled={!volunteerName.trim() || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              <UserPlus size={16} />
              เพิ่มแพทย์อาสา
            </button>
          </div>
          <button className="flex flex-1 md:flex-none justify-center items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer transition-all hover:bg-slate-50 hover:-translate-y-[1px] shadow-sm hover:shadow-md" onClick={() => setIsHistoryOpen(true)}>
            <History size={18} />
            ประวัติการจัดการ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible mb-8">
        <div className="w-full overflow-x-auto pb-[120px] -mb-[120px]">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 w-1/4">รายชื่อแพทย์</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center w-[10%]">ไม่สะดวก</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center w-[10%]">พร้อมรับคิว</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center w-[10%]">ผู้จัดการคิว</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center w-[10%]">เคสสตอรี่</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 w-1/4">รายละเอียดสตอรี่</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 w-[15%]">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <TableSkeleton rows={4} columns={6} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-rose-500 font-medium">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
                  </td>
                </tr>
              ) : mainQueueUsers.length > 0 ? (
                mainQueueUsers.map(queueUser => (
                  <QueueRow key={queueUser.discord_id} user={queueUser} />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4">
                    <EmptyState
                      title="ไม่มีบุคลากรในคิวปฏิบัติการ"
                      description="รายชื่อแพทย์ที่เข้าเวรจะปรากฏที่นี่โดยอัตโนมัติ"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {storyLockedUsers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border-t-4 border-t-rose-500 border border-slate-200 overflow-visible mb-8 mt-6">
          <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-rose-600 m-0 flex items-center gap-2">
                <Activity size={20} />
                คิวสตอรี่ (Story Queue)
              </h2>
              <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded-full text-xs font-bold shadow-sm">
                {storyLockedUsers.length} คน
              </span>
            </div>
          </div>
          <div className="w-full overflow-x-auto pb-[120px] -mb-[120px]">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 w-1/4">ชื่อแพทย์</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center w-[10%]">สถานะสตอรี่</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 w-1/4">รายละเอียดสตอรี่</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 w-[15%]">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {storyLockedUsers.map(queueUser => (
                  <QueueRow key={queueUser.discord_id} user={queueUser} isStoryQueue={true} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        isAdmin={checkIsAdmin(user?.role)}
      />
    </div>
  );
}



