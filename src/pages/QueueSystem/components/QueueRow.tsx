import { useEffect, useState, useMemo, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { QueueUser, QueueStatusType } from '../types';
import { useQueueMutations } from '../hooks/useQueueMutations';
import SmartTimePicker from '../../../components/common/SmartTimePicker';
import SmartSelect from '../../../components/common/SmartSelect';
import Swal from 'sweetalert2';
import { useGangs, useFamilies } from '../../SystemSettings/hooks/useGangsFamilies';

interface QueueRowProps {
  user: QueueUser;
  isStoryQueue?: boolean;
}

export function QueueRow({ user, isStoryQueue = false }: QueueRowProps) {
  const { updateStatus, updateStoryDetails, lockStory, endStory, updateVolunteer, removeVolunteer } = useQueueMutations();
  const { data: gangs = [] } = useGangs();
  const { data: families = [] } = useFamilies();
  
  const factionOptions = useMemo(() => {
    const gangOpts = gangs.map(g => ({ value: g.name, label: g.name }));
    const famOpts = families.map(f => ({ value: f.name, label: f.name }));
    return [...gangOpts, ...famOpts];
  }, [gangs, families]);

  const statusRecord = user.status_record;
  const [localStatus, setLocalStatus] = useState<QueueStatusType | null>(statusRecord?.status || null);
  
  // Local state for story inputs
  const [targetTime, setTargetTime] = useState(statusRecord?.story_target_time || '');
  const [gang1, setGang1] = useState(statusRecord?.story_gang_1 || '');
  const [gang2, setGang2] = useState(statusRecord?.story_gang_2 || '');
  const [storyType, setStoryType] = useState(statusRecord?.story_type || 'ทั่วไป (1 คน)');
  const [isProcessing, setIsProcessing] = useState(false); const processingRef = useRef(false);

  // Sync local state when external data changes
  useEffect(() => {
    setLocalStatus(statusRecord?.status || null);
    if (statusRecord) {
      setTargetTime(statusRecord.story_target_time || '');
      setGang1(statusRecord.story_gang_1 || '');
      setGang2(statusRecord.story_gang_2 || '');
      setStoryType(statusRecord.story_type || 'ทั่วไป (1 คน)');
    } else {
      setTargetTime('');
      setGang1('');
      setGang2('');
      setStoryType('ทั่วไป (1 คน)');
    }
  }, [statusRecord]);

  const currentStatus = localStatus;

  // Handle Checkbox Changes
  const handleStatusChange = async (newStatus: QueueStatusType) => {
    // If story is locked, prevent changing status
    if (statusRecord?.story_locked || isProcessing || processingRef.current) return; processingRef.current = true;

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
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: "Error: " + err.message });
      } finally {
        setIsProcessing(false); processingRef.current = false;
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
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: "Error: " + err.message });
    } finally {
      setIsProcessing(false); processingRef.current = false;
    }
  };

  // Handle Story Typing
  const handleTimeBlur = () => {
    // Save details when time input loses focus
    if (targetTime) {
      updateStoryDetails({
        discord_id: user.discord_id,
        targetTime,
        gang1,
        gang2,
        type: storyType
      });
    } else {
      // If time is cleared, cancel the story prep
      endStory({
        discord_id: user.discord_id,
        statusRecord: statusRecord || null,
        saveToHistory: false
      });
    }
  };

  // Auto-Tick Logic
  useEffect(() => {
    if (!statusRecord?.story_target_time || statusRecord?.story_locked) return;

    const checkTime = () => {
      const now = new Date();
      const [hh, mm] = statusRecord.story_target_time!.split(':').map(Number);
      
      const target = new Date();
      target.setHours(hh, mm, 0, 0);

      // Handle Midnight Crossover
      if (now.getTime() - target.getTime() > 12 * 60 * 60 * 1000) {
        target.setDate(target.getDate() + 1);
      } else if (target.getTime() - now.getTime() > 12 * 60 * 60 * 1000) {
        target.setDate(target.getDate() - 1);
      }

      if (now >= target) {
        lockStory(user.discord_id);
      }
    };

    const interval = setInterval(checkTime, 1000);
    checkTime();

    return () => clearInterval(interval);
  }, [statusRecord, lockStory, user.discord_id]);

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
    if (currentStatus === 'story') return isLocked ? 'bg-purple-50/50 hover:bg-purple-50 transition-colors border-b border-slate-100' : '';
    return 'hover:bg-slate-50 transition-colors border-b border-slate-100';
  };

  const showStoryInputs = !!targetTime || !!statusRecord?.story_target_time;
  const isLocked = !!statusRecord?.story_locked;

  return (
    <tr className={getRowClass()}>
      <td className="p-4 align-middle w-[25%]">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
              {user.ic_name.charAt(0)}
            </div>
          )}
          <span className={`font-bold text-[0.95rem] ${currentStatus === 'unavailable' ? 'line-through decoration-red-500 decoration-2 text-red-400 italic' : 'text-slate-800'}`}>
            {user.ic_name}
          </span>
          {user.is_current_user && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">(คุณ)</span>}
          {user.is_volunteer && (
            <button 
              onClick={async () => {
                if (isProcessing || processingRef.current) return; processingRef.current = true;
                setIsProcessing(true);
                try {
                  await removeVolunteer(user.discord_id);
                } finally {
                  setIsProcessing(false); processingRef.current = false;
                }
              }}
              disabled={isProcessing}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isProcessing ? 0.5 : 1,
                marginLeft: '8px',
                borderRadius: '4px'
              }}
              title="ลบหมออาสา"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </td>

      {!isStoryQueue && (
        <>
          <td className="p-4 align-middle text-center w-[10%]">
            <label className={`relative inline-flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all duration-200 cursor-pointer ${currentStatus === "unavailable" ? "bg-red-100 border-red-500 text-red-600 scale-110" : "bg-slate-50 border-slate-200 text-transparent hover:border-slate-400"} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
              <input type="checkbox" className="absolute opacity-0 w-0 h-0" 
                checked={currentStatus === 'unavailable'} 
                onChange={() => handleStatusChange('unavailable')} 
                disabled={isLocked}
              />
              <Check size={16} />
            </label>
          </td>

          <td className="p-4 align-middle text-center w-[10%]">
            <label className={`relative inline-flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all duration-200 cursor-pointer ${currentStatus === "queued" ? "bg-emerald-100 border-emerald-500 text-emerald-600 scale-110" : "bg-slate-50 border-slate-200 text-transparent hover:border-slate-400"} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
              <input type="checkbox" className="absolute opacity-0 w-0 h-0" 
                checked={currentStatus === 'queued'} 
                onChange={() => handleStatusChange('queued')} 
                disabled={isLocked}
              />
              <Check size={16} />
            </label>
          </td>

          <td className="p-4 align-middle text-center w-[10%]">
            {user.is_volunteer ? (
              <span style={{ color: '#cbd5e1' }}>-</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <label className={`relative inline-flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all duration-200 cursor-pointer ${currentStatus === "manager" ? "bg-sky-100 border-sky-500 text-sky-600 scale-110" : "bg-slate-50 border-slate-200 text-transparent hover:border-slate-400"} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input type="checkbox" className="absolute opacity-0 w-0 h-0" 
                    checked={currentStatus === 'manager'} 
                    onChange={() => handleStatusChange('manager')} 
                    disabled={isLocked}
                  />
                  <Check size={16} />
                </label>
                {currentStatus === 'manager' && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0ea5e9' }}>
                    ⏱ {managerTimer}
                  </span>
                )}
              </div>
            )}
          </td>
        </>
      )}

      <td className="p-4 align-middle text-center w-[10%]">
        {user.is_volunteer ? (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ) : (
          <label className={`relative inline-flex items-center justify-center w-8 h-8 rounded-xl border-2 transition-all duration-200 cursor-pointer ${currentStatus === "story" && isLocked ? "bg-purple-100 border-purple-500 text-purple-600 scale-110" : "bg-slate-50 border-slate-200 text-transparent hover:border-slate-400"} ${!isLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
            <input type="checkbox" className="absolute opacity-0 w-0 h-0" 
              checked={currentStatus === 'story' && isLocked} 
              onChange={async () => {
                if (isLocked) {
                  if (!gang1.trim() || !gang2.trim()) {
                    Swal.fire({
                      title: 'ข้อมูลไม่ครบถ้วน',
                      text: 'กรุณากรอกชื่อแก๊งให้ครบทั้งสองช่องก่อนที่จะจบเคสสตอรี่',
                      icon: 'warning',
                      confirmButtonColor: '#ef4444'
                    });
                    return;
                  }
                  
                  const result = await Swal.fire({
                    title: 'ยืนยันจบเคสสตอรี่?',
                    text: 'คุณต้องการจบเคสสตอรี่นี้ใช่หรือไม่? ข้อมูลจะถูกบันทึกลงในประวัติสตอรี่',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'ยืนยันจบเคส',
                    cancelButtonText: 'ยกเลิก',
                    confirmButtonColor: '#10b981'
                  });
                  
                  if (result.isConfirmed) {
                    endStory({
                      discord_id: user.discord_id,
                      statusRecord: statusRecord!,
                      saveToHistory: true
                    });
                  }
                }
              }} 
              disabled={!isLocked}
            />
            <Check size={16} />
          </label>
        )}
      </td>

      <td className="p-4 align-middle w-[35%]">
        {user.is_volunteer ? (
          <span style={{ color: '#cbd5e1' }}>ไม่มีข้อมูลสตอรี่สำหรับหมออาสา</span>
        ) : (
          <div className="flex items-center gap-2">
            <SmartTimePicker 
              value={targetTime}
              onChange={setTargetTime}
              onBlur={handleTimeBlur}
              placeholder="00:00"
            />
            
            {showStoryInputs && (
              <>
                <div className="relative" style={{ width: '160px' }}>
                  <SmartSelect
                    options={factionOptions.filter(opt => opt.value !== gang2)}
                    value={gang1}
                    onChange={(val) => {
                      setGang1(val);
                      if (targetTime) {
                        updateStoryDetails({
                          discord_id: user.discord_id,
                          targetTime,
                          gang1: val,
                          gang2,
                          type: storyType
                        });
                      }
                    }}
                    searchable
                    placeholder="แก๊ง/แฟม"
                  />
                </div>
                <span className="text-xs font-black text-slate-400 mx-1">VS</span>
                <div className="relative" style={{ width: '160px' }}>
                  <SmartSelect
                    options={factionOptions.filter(opt => opt.value !== gang1)}
                    value={gang2}
                    onChange={(val) => {
                      setGang2(val);
                      if (targetTime) {
                        updateStoryDetails({
                          discord_id: user.discord_id,
                          targetTime,
                          gang1,
                          gang2: val,
                          type: storyType
                        });
                      }
                    }}
                    searchable
                    placeholder="แก๊ง/แฟม"
                  />
                </div>
                <div className="relative" style={{ width: '160px' }}>
                  <SmartSelect
                    value={storyType}
                    onChange={(val) => {
                      setStoryType(val);
                      if (targetTime) {
                        updateStoryDetails({
                          discord_id: user.discord_id,
                          targetTime,
                          gang1,
                          gang2,
                          type: val
                        });
                      }
                    }}
                    options={[
                      { value: 'ไฟต์ตรง (1 คน)', label: 'ไฟต์ตรง (1 คน)' },
                      { value: 'ไฟต์ตรง (2 คน)', label: 'ไฟต์ตรง (2 คน)' },
                      { value: 'บั๊มรถ (1 คน)', label: 'บั๊มรถ (1 คน)' },
                      { value: 'บั๊มรถ (2 คน)', label: 'บั๊มรถ (2 คน)' }
                    ]}
                  />
                </div>

                {/* Cancel Button - clears everything without history */}
                <button 
                  className="flex items-center gap-1.5 px-3 h-[38px] bg-white hover:bg-rose-50 text-rose-500 rounded-xl font-bold text-sm transition-all border border-rose-200 hover:border-rose-300 shadow-sm whitespace-nowrap"
                  onClick={async () => {
                    if (isProcessing || processingRef.current) return; processingRef.current = true;
                    setIsProcessing(true);
                    try {
                      await endStory({
                        discord_id: user.discord_id,
                        statusRecord: statusRecord!,
                        saveToHistory: false
                      });
                    } finally {
                      setIsProcessing(false); processingRef.current = false;
                    }
                  }}
                  disabled={isProcessing}
                  title="ยกเลิกสตอรี่ (ไม่บันทึกลงประวัติ)"
                >
                  <X size={16} strokeWidth={2.5} />
                  ยกเลิก
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

