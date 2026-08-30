import { useState, useRef } from 'react';
import { History, RefreshCw, UserPlus } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">????????????? (Queue System)</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">
            ??????????????????????????????????? 
            <span style={{ marginLeft: '8px', color: realtimeConnected ? '#10b981' : '#ef4444' }}>
              ? {realtimeConnected ? '????????????? (Realtime)' : '??????????????? (Offline)'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="???????????" 
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddVolunteer()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                width: '180px'
              }}
            />
            <button 
              onClick={(e) => { e.currentTarget.disabled = true; handleAddVolunteer(); }}
              disabled={!volunteerName.trim() || isProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: volunteerName.trim() ? 'pointer' : 'not-allowed',
                opacity: volunteerName.trim() ? 1 : 0.6,
                fontWeight: 500
              }}
            >
              <UserPlus size={18} />
              ?????????
            </button>
          </div>
          <button className="flex flex-1 md:flex-none justify-center items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer transition-all hover:bg-slate-50 hover:-translate-y-[1px] shadow-sm hover:shadow-md" onClick={() => setIsHistoryOpen(true)}>
            <History size={18} />
            ????????????????
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible mb-8">
        <div className="w-full overflow-x-auto pb-[120px] -mb-[120px]">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50" style={{ width: '25%' }}>???????</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center" style={{ width: '10%' }}>????????</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center" style={{ width: '10%' }}>???</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center" style={{ width: '10%' }}>?????????</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center" style={{ width: '10%' }}>??????</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50" style={{ width: '25%' }}>????????????????</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50" style={{ width: '15%' }}>????????</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <RefreshCw className="animate-spin" />
                      <span>??????????????????????...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                    ?????????????????????????????: {(error as Error).message}
                  </td>
                </tr>
              ) : mainQueueUsers.length > 0 ? (
                mainQueueUsers.map(queueUser => (
                  <QueueRow key={queueUser.discord_id} user={queueUser} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    ???????????????????????
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {storyLockedUsers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border-t-4 border-t-rose-500 border border-slate-200 overflow-visible mb-8 mt-6">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e11d48', margin: 0 }}>
              ????????? (Story Queue)
            </h2>
            <span style={{ marginLeft: '12px', padding: '4px 10px', backgroundColor: '#e11d48', color: 'white', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600 }}>
              {storyLockedUsers.length} ??
            </span>
          </div>
          <div className="w-full overflow-x-auto pb-[120px] -mb-[120px]">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50" style={{ width: '25%' }}>???????????</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 text-center" style={{ width: '10%' }}>??????</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50" style={{ width: '25%' }}>????????????????</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50" style={{ width: '15%' }}>????????</th>
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
        isAdmin={user?.role === 'admin'}
      />
    </div>
  );
}




