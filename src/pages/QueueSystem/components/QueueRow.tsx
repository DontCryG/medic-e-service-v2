import { useEffect, useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import type { QueueUser, QueueStatusType } from '../types';
import { useQueueMutations } from '../hooks/useQueueMutations';
import SmartTimePicker from '../../../components/common/SmartTimePicker';
import SmartSelect from '../../../components/common/SmartSelect';
import Swal from 'sweetalert2';
import { useGangs, useFamilies } from '../../SystemSettings/hooks/useGangsFamilies';

interface QueueRowProps {
  user: QueueUser;
}

export function QueueRow({ user }: QueueRowProps) {
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
  const [storyType, setStoryType] = useState(statusRecord?.story_type || 'ไฟต์ตรง (1 คน)');

  // Sync local state when external data changes
  useEffect(() => {
    setLocalStatus(statusRecord?.status || null);
    if (statusRecord) {
      setTargetTime(statusRecord.story_target_time || '');
      setGang1(statusRecord.story_gang_1 || '');
      setGang2(statusRecord.story_gang_2 || '');
      setStoryType(statusRecord.story_type || 'ไฟต์ตรง (1 คน)');
    } else {
      setTargetTime('');
      setGang1('');
      setGang2('');
      setStoryType('ไฟต์ตรง (1 คน)');
    }
  }, [statusRecord]);

  const currentStatus = localStatus;

  // Handle Checkbox Changes
  const handleStatusChange = (newStatus: QueueStatusType) => {
    // If story is locked, prevent changing status
    if (statusRecord?.story_locked) return;

    // If clicking the currently checked status, untick it by setting to null
    if (currentStatus === newStatus) {
      setLocalStatus(null);
      if (user.is_volunteer) {
        updateVolunteer({ id: user.discord_id, newStatus: null }).catch(err => {
          setLocalStatus(statusRecord?.status || null);
          alert("Error: " + err.message);
        });
      } else {
        updateStatus({
          discord_id: user.discord_id,
          newStatus: null,
          currentStatusRecord: statusRecord
        }).catch(err => {
          setLocalStatus(statusRecord?.status || null);
          alert("Error in updateStatus (null): " + err.message);
        });
      }
      return;
    }

    setLocalStatus(newStatus);
    
    if (user.is_volunteer) {
      updateVolunteer({ id: user.discord_id, newStatus }).catch(err => {
        setLocalStatus(statusRecord?.status || null);
        alert("Error: " + err.message);
      });
    } else {
      updateStatus({
        discord_id: user.discord_id,
        newStatus,
        currentStatusRecord: statusRecord
      }).catch(err => {
        setLocalStatus(statusRecord?.status || null);
        alert("Error in updateStatus: " + err.message);
      });
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
    if (currentStatus === 'unavailable') return 'row-active-unavailable';
    if (currentStatus === 'queued') return 'row-active-queued';
    if (currentStatus === 'manager') return 'row-active-manager';
    if (currentStatus === 'story') return isLocked ? 'row-active-story' : '';
    return '';
  };

  const showStoryInputs = !!targetTime || !!statusRecord?.story_target_time;
  const isLocked = !!statusRecord?.story_locked;

  return (
    <tr className={getRowClass()}>
      <td className="col-name">
        <div className="user-name-wrapper">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="user-avatar" />
          ) : (
            <div className="user-avatar">
              {user.ic_name.charAt(0)}
            </div>
          )}
          <span className="user-name">{user.ic_name}</span>
          {user.is_current_user && <span className="badge-me">(คุณ)</span>}
          {user.is_volunteer && (
            <button 
              onClick={() => removeVolunteer(user.discord_id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
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

      <td className="col-unavailable">
        <label className={`custom-checkbox ${currentStatus === 'unavailable' ? 'checked-unavailable' : ''} ${isLocked ? 'disabled' : ''}`}>
          <input 
            type="checkbox" 
            checked={currentStatus === 'unavailable'} 
            onChange={() => handleStatusChange('unavailable')} 
            disabled={isLocked}
          />
          <Check size={16} />
        </label>
      </td>

      <td className="col-queued">
        <label className={`custom-checkbox ${currentStatus === 'queued' ? 'checked-queued' : ''} ${isLocked ? 'disabled' : ''}`}>
          <input 
            type="checkbox" 
            checked={currentStatus === 'queued'} 
            onChange={() => handleStatusChange('queued')} 
            disabled={isLocked}
          />
          <Check size={16} />
        </label>
      </td>

      <td className="col-manager">
        {user.is_volunteer ? (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <label className={`custom-checkbox ${currentStatus === 'manager' ? 'checked-manager' : ''} ${isLocked ? 'disabled' : ''}`}>
              <input 
                type="checkbox" 
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

      <td className="col-story">
        {user.is_volunteer ? (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ) : (
          <label className={`custom-checkbox ${currentStatus === 'story' && isLocked ? 'checked-story' : ''} ${(!isLocked && !targetTime) ? 'disabled' : ''}`}>
            <input 
              type="checkbox" 
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
                } else if (targetTime) {
                  lockStory(user.discord_id);
                }
              }} 
              disabled={!isLocked && !targetTime}
            />
            <Check size={16} />
          </label>
        )}
      </td>

      <td className="col-story-time">
        {user.is_volunteer ? (
          <span style={{ color: '#cbd5e1' }}>ไม่มีข้อมูลสตอรี่สำหรับหมออาสา</span>
        ) : (
          <div className="story-inputs">
            <SmartTimePicker 
              value={targetTime}
              onChange={setTargetTime}
              onBlur={handleTimeBlur}
              placeholder="00:00"
            />
            
            {showStoryInputs && (
              <>
                <div className="premium-dropdown" style={{ width: '160px' }}>
                  <SmartSelect
                    options={factionOptions}
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
                <span className="story-vs">VS</span>
                <div className="premium-dropdown" style={{ width: '160px' }}>
                  <SmartSelect
                    options={factionOptions}
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
                <div className="premium-dropdown" style={{ width: '160px' }}>
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
                  className="cancel-story-btn" 
                  onClick={() => {
                    endStory({
                      discord_id: user.discord_id,
                      statusRecord: statusRecord!,
                      saveToHistory: false
                    });
                  }}
                  title="ยกเลิกสตอรี่ (ไม่บันทึกประวัติ)"
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
