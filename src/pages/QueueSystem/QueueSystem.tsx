import { useState, useRef } from 'react';
import { History, UserPlus, LayoutGrid } from 'lucide-react';
import TableSkeleton from '@/components/common/TableSkeleton';
import EmptyState from '@/components/common/EmptyState';
import PageHeader from '@/components/common/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useQueue } from './hooks/useQueue';
import { useQueueMutations } from './hooks/useQueueMutations';
import { QueueRow } from './components/QueueRow';
import { HistoryModal } from './components/HistoryModal';

export function QueueSystem() {
  const { user } = useAuthStore();
  const { queueUsers, isLoading, realtimeConnected, error } = useQueue(user?.discord_id);
  const { addVolunteer } = useQueueMutations();
  
  const [volunteerName, setVolunteerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const processingRef = useRef(false);
  const handleAddVolunteer = async () => {
    if (!volunteerName.trim() || isProcessing || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      await addVolunteer(volunteerName.trim());
      setVolunteerName('');
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      <PageHeader
        title="ระบบจัดการคิว (Queue System)"
        subtitle="แสดงสถานะแพทย์ที่กำลังเข้าเวร และจัดลำดับการเรียกคิวแบบเรียลไทม์"
        icon={<LayoutGrid size={18} />}
        iconTheme="purple"
        badge={
          realtimeConnected
            ? { label: 'ระบบเชื่อมต่อสด (Realtime)', variant: 'live' }
            : { label: 'ขาดการเชื่อมต่อ (Offline)', variant: 'warning' }
        }
        actions={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <input 
                type="text" 
                placeholder="ระบุชื่อแพทย์อาสา..." 
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddVolunteer()}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-lg outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500/20 w-44 transition-all placeholder:text-slate-400 font-medium"
              />
              <button 
                onClick={(e) => { e.currentTarget.disabled = true; handleAddVolunteer(); }}
                disabled={!volunteerName.trim() || isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserPlus size={14} className="shrink-0" />
                <span>เพิ่มแพทย์อาสา</span>
              </button>
            </div>
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors hover:bg-slate-50 shadow-2xs whitespace-nowrap shrink-0" 
              onClick={() => setIsHistoryOpen(true)}
            >
              <History size={14} className="shrink-0 text-slate-500" />
              <span>ประวัติการจัดการ</span>
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-2xs border border-slate-200/80 overflow-visible mb-6">
        <div className="w-full overflow-x-auto pb-[120px] -mb-[120px]">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70 w-[30%]">รายชื่อแพทย์</th>
                <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70 text-center w-[12%]">ไม่สะดวก</th>
                <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70 text-center w-[12%]">พร้อมรับคิว</th>
                <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70 text-center w-[12%]">ผู้จัดการคิว</th>
                <th className="p-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/70 w-[34%]">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-6">
                    <TableSkeleton rows={4} columns={5} />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-rose-500 font-medium">
                    เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
                  </td>
                </tr>
              ) : queueUsers.length > 0 ? (
                queueUsers.map(queueUser => (
                  <QueueRow key={queueUser.discord_id} user={queueUser} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6">
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

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
    </div>
  );
}

export default QueueSystem;
