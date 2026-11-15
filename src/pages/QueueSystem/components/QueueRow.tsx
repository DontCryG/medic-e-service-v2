import { useEffect, useState, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { QueueUser, QueueStatusType } from '../types';
import { useQueueMutations } from '../hooks/useQueueMutations';
import { enterpriseSwal } from '@/utils/alert';

interface QueueRowProps {
  user: QueueUser;
}

export function QueueRow({ user }: QueueRowProps) {
  const { updateStatus, updateRemark, updateVolunteer, removeVolunteer } = useQueueMutations();

  const statusRecord = user.status_record;
  const [localStatus, setLocalStatus] = useState<QueueStatusType | null>(statusRecord?.status || null);
  const [remark, setRemark] = useState(statusRecord?.remark || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  // Sync local state when external data changes
  useEffect(() => {
    if (!isProcessing) {
      setLocalStatus(statusRecord?.status || null);
      setRemark(statusRecord?.remark || '');
    }
  }, [statusRecord, isProcessing]);

  const currentStatus = isProcessing ? localStatus : (statusRecord?.status || null);

  // Handle Checkbox Changes
  const handleStatusChange = async (newStatus: QueueStatusType) => {
    if (isProcessing || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    // If clicking the currently checked status, untick it by setting to null
    if (currentStatus === newStatus) {
      setLocalStatus(null);
      try {
        if (user.is_volunteer) {
          await updateVolunteer({ id: user.discord_id, newStatus: null });
        } else {
          await updateStatus({
            discord_id: user.discord_id,
            newStatus: null,
            currentStatusRecord: statusRecord
          });
        }
      } catch (err: any) {
        setLocalStatus(statusRecord?.status || null);
        enterpriseSwal.fire({ icon: 'error', title: 'ผิดพลาด', text: "Error: " + err.message });
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
      }
      return;
    }

    setLocalStatus(newStatus);
    
    try {
      if (user.is_volunteer) {
        await updateVolunteer({ id: user.discord_id, newStatus });
      } else {
        await updateStatus({
          discord_id: user.discord_id,
          newStatus,
          currentStatusRecord: statusRecord
        });
      }
    } catch (err: any) {
      setLocalStatus(currentStatus);
      enterpriseSwal.fire({ icon: 'error', title: 'ผิดพลาด', text: "Error: " + err.message });
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  // Manager Timer Calculation
  const [managerTimer, setManagerTimer] = useState('00:00:00');
  useEffect(() => {
    if (currentStatus === 'manager' && statusRecord?.manager_start_time) {
      const interval = setInterval(() => {
        const start = new Date(statusRecord.manager_start_time!).getTime();
        const now = new Date().getTime();
        const diffMs = now - start;
        
        const h = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
        setManagerTimer(`${h}:${m}:${s}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setManagerTimer('00:00:00');
    }
  }, [currentStatus, statusRecord?.manager_start_time]);

  // Row Classes
  const getRowClass = () => {
    if (currentStatus === 'unavailable') return 'bg-red-50/50 hover:bg-red-50 transition-colors border-b border-slate-100';
    if (currentStatus === 'queued') return 'bg-emerald-50/50 hover:bg-emerald-50 transition-colors border-b border-slate-100';
    if (currentStatus === 'manager') return 'bg-sky-50/50 hover:bg-sky-50 transition-colors border-b border-slate-100';
    return 'hover:bg-slate-50 transition-colors border-b border-slate-100';
  };

  return (
    <tr className={getRowClass()}>
      {/* 1. Doctor Name & Avatar */}
      <td className="p-4 align-middle w-[30%]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-200/60 shrink-0 shadow-sm overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.ic_name.charAt(0)
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`font-bold text-sm tracking-tight ${currentStatus === 'unavailable' ? 'line-through decoration-rose-500 decoration-2 text-rose-400 italic' : 'text-slate-900'}`}>
              {user.ic_name}
            </span>
            {user.is_current_user && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[0.7rem] font-bold">
                (คุณ)
              </span>
            )}
          </div>
          {user.is_volunteer && (
            <button 
              onClick={async () => {
                if (isProcessing || processingRef.current) return;
                processingRef.current = true;
                setIsProcessing(true);
                try {
                  await removeVolunteer(user.discord_id);
                } finally {
                  setIsProcessing(false);
                  processingRef.current = false;
                }
              }}
              disabled={isProcessing}
              className="p-1 ml-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="ลบแพทย์อาสา"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </td>

      {/* 2. Unavailable */}
      <td className="p-4 align-middle text-center w-[12%]">
        <label className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer ${currentStatus === "unavailable" ? "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/25 scale-105" : "bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400"}`} title="ไม่สะดวก">
          <input 
            type="checkbox" 
            className="absolute opacity-0 w-0 h-0" 
            checked={currentStatus === 'unavailable'} 
            onChange={() => handleStatusChange('unavailable')} 
          />
          <Check size={18} strokeWidth={3} />
        </label>
      </td>

      {/* 3. Ready / Queued */}
      <td className="p-4 align-middle text-center w-[12%]">
        <label className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer ${currentStatus === "queued" ? "bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-105" : "bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400"}`} title="พร้อมรับคิว">
          <input 
            type="checkbox" 
            className="absolute opacity-0 w-0 h-0" 
            checked={currentStatus === 'queued'} 
            onChange={() => handleStatusChange('queued')} 
          />
          <Check size={18} strokeWidth={3} />
        </label>
      </td>

      {/* 4. Queue Manager */}
      <td className="p-4 align-middle text-center w-[12%]">
        {user.is_volunteer ? (
          <span className="text-slate-300">-</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <label className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer ${currentStatus === "manager" ? "bg-sky-500 border-sky-600 text-white shadow-md shadow-sky-500/25 scale-105" : "bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400"}`} title="ผู้จัดการคิว">
              <input 
                type="checkbox" 
                className="absolute opacity-0 w-0 h-0" 
                checked={currentStatus === 'manager'} 
                onChange={() => handleStatusChange('manager')} 
              />
              <Check size={18} strokeWidth={3} />
            </label>
            {currentStatus === 'manager' && (
              <span className="text-[0.7rem] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                ⏱ {managerTimer}
              </span>
            )}
          </div>
        )}
      </td>

      {/* 5. Remarks */}
      <td className="p-4 align-middle w-[34%]">
        <input
          type="text"
          className="w-full max-w-sm px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-300"
          placeholder="เพิ่มหมายเหตุ..."
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          onBlur={() => {
            if (remark !== (statusRecord?.remark || '')) {
              updateRemark({ discord_id: user.discord_id, remark });
            }
          }}
          disabled={user.is_volunteer}
        />
      </td>
    </tr>
  );
}
