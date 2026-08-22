import { Play, Pause, Square, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { formatTime, getInitial } from '../utils/dutyUtils';
import { useDutyTimer } from '../hooks/useDutyTimer';

interface DutyControlsProps {
  profile: any;
  avatarUrl: string | null;
  currentSession: any;
  loading: boolean;
  onClockIn: (e?: any) => void;
  onBreak: (e?: any) => void;
  onClockOut: (e?: any) => void;
}

export default function DutyControls({ 
  profile, 
  avatarUrl, 
  currentSession, 
  loading, 
  onClockIn, 
  onBreak, 
  onClockOut 
}: DutyControlsProps) {
  const dutyTime = useDutyTimer(currentSession);
  return (
    <div className="duty-action-panel">
      <div className="duty-user-info">
        <div className="duty-avatar" style={{ padding: avatarUrl ? 0 : undefined, overflow: 'hidden' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitial(profile.ic_name)
          )}
        </div>
        <div className="duty-details">
          <h2>{profile.ic_name}</h2>
          <p>{profile.position?.name || 'ไม่มีตำแหน่ง'}</p>
          {currentSession && (
            <div className={`duty-timer ${currentSession.status === 'on_break' ? 'break' : ''}`}>
              <Clock size={18} />
              {currentSession.status === 'on_break' ? 'กำลังพักเบรก' : 'เวลาเข้าเวร:'} 
              {currentSession.status === 'on_duty' && <span style={{ marginLeft: '5px' }}>{formatTime(dutyTime)}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="duty-actions">
        {!currentSession ? (
          <button 
            className="duty-btn btn-clock-in" 
            onClick={(e) => { e.currentTarget.disabled = true; onClockIn(e); }} 
            disabled={loading}
          >
            {loading ? <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</> : <><Play size={20} /> เข้าเวร</>}
          </button>
        ) : (
          <>
            <button 
              className="duty-btn btn-break" 
              onClick={(e) => { e.currentTarget.disabled = true; onBreak(e); }} 
              disabled={loading}
            >
              {loading ? (
                 <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</>
              ) : currentSession.status === 'on_break' ? (
                <><RefreshCw size={20} /> กลับมาเข้าเวร</>
              ) : (
                <><Pause size={20} /> พักเบรก</>
              )}
            </button>
            <button 
              className="duty-btn btn-clock-out" 
              onClick={(e) => { e.currentTarget.disabled = true; onClockOut(e); }} 
              disabled={loading}
            >
              {loading ? <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</> : <><Square size={20} /> ออกเวร</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

