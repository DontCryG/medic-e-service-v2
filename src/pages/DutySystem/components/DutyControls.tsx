import { Play, Pause, Square, Clock, RefreshCw, Loader2, Gift } from "lucide-react";
import { formatTime, getInitial } from "../utils/dutyUtils";
import { useDutyTimer } from "../hooks/useDutyTimer";

interface DutyControlsProps {
  profile: any;
  avatarUrl: string | null;
  currentSession: any;
  loading: boolean;
  onClockIn: (e?: any) => void;
  onBreak: (e?: any) => void;
  onClockOut: (e?: any) => void;
  onSpecialDutyClick?: () => void;
}

export default function DutyControls({
  profile,
  avatarUrl,
  currentSession,
  loading,
  onClockIn,
  onBreak,
  onClockOut,
  onSpecialDutyClick
}: DutyControlsProps) {
  const dutyTime = useDutyTimer(currentSession);
  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white flex items-center justify-center text-4xl font-bold shadow-lg shadow-purple-500/30 overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            getInitial(profile.ic_name)
          )}
        </div>
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-2xl font-bold text-slate-800 m-0 mb-1">{profile.ic_name}</h2>
          <p className="text-slate-500 m-0 mb-3 text-lg">{profile.position?.name || "ไม่ทราบตำแหน่ง"}</p>
          {currentSession && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold ${currentSession.status === "on_break" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
              <Clock size={18} />
              {currentSession.status === "on_break" ? "พักเวร" : "เข้าเวรมาแล้ว:"} 
              {currentSession.status === "on_duty" && <span className="ml-1">{formatTime(dutyTime)}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {!currentSession ? (
            <button 
              className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:-translate-y-1 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full sm:w-auto" 
              onClick={(e) => { e.currentTarget.disabled = true; onClockIn(e); }} 
              disabled={loading}
            >
              {loading ? <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</> : <><Play size={20} /> เข้าเวร</>}
            </button>
          ) : (
            <>
              <button 
                className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:-translate-y-1 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full sm:w-auto" 
                onClick={(e) => { e.currentTarget.disabled = true; onBreak(e); }} 
                disabled={loading}
              >
                {loading ? (
                   <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</>
                ) : currentSession.status === "on_break" ? (
                  <><RefreshCw size={20} /> กลับจากพัก</>
                ) : (
                  <><Pause size={20} /> พักเวร</>
                )}
              </button>
              <button 
                className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-500/30 hover:bg-rose-600 hover:-translate-y-1 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full sm:w-auto" 
                onClick={(e) => { e.currentTarget.disabled = true; onClockOut(e); }} 
                disabled={loading}
              >
                {loading ? <><Loader2 size={20} className="animate-spin"/> กำลังดำเนินการ...</> : <><Square size={20} /> ออกเวร</>}
              </button>
            </>
          )}
        </div>
        {profile?.role === "admin" && onSpecialDutyClick && (
          <button 
            onClick={onSpecialDutyClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-100 bg-purple-50 rounded-md transition-colors border border-purple-200 cursor-pointer w-full sm:w-auto"
          >
            <Gift size={16} />
            มอบเวลาพิเศษ (สอบหมอ/พี่เลี้ยง)
          </button>
        )}
      </div>
    </div>
  );
}
