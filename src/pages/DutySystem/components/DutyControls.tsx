import { Play, Pause, Square, Clock, RefreshCw, Loader2, Gift, ShieldAlert } from "lucide-react";
import { formatTime, getInitial } from "../utils/dutyUtils";
import { useDutyTimer } from "../hooks/useDutyTimer";
import { isAdmin } from "@/utils/permissions";

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
  const isOnDuty = currentSession?.status === "on_duty";
  const isOnBreak = currentSession?.status === "on_break";

  return (
    <div className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
      {/* Top Accent Gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        isOnDuty 
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
          : isOnBreak 
          ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
          : 'bg-gradient-to-r from-slate-300 to-slate-400'
      }`} />

      <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
        
        {/* Doctor Info Section */}
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5 w-full xl:w-auto">
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-lg overflow-hidden shrink-0 border-2 ${
              isOnDuty 
                ? 'border-emerald-500 ring-4 ring-emerald-500/20' 
                : isOnBreak 
                ? 'border-amber-500 ring-4 ring-amber-500/20' 
                : 'border-white'
            }`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitial(profile.ic_name)
              )}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isOnDuty ? 'bg-emerald-500' : isOnBreak ? 'bg-amber-500' : 'bg-slate-400'
            }`} />
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 m-0 tracking-tight">
                {profile.ic_name}
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {profile.position?.name || "แพทย์"}
              </span>
            </div>
            
            <p className="text-slate-400 text-xs font-mono mt-1 m-0">
              ID: {profile.discord_id}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              {isOnDuty && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  กำลังปฏิบัติหน้าที่ (ON DUTY)
                </span>
              )}
              {isOnBreak && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  กำลังพักเบรก (ON BREAK)
                </span>
              )}
              {!currentSession && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  อยู่นอกเวลาเวร (OFF DUTY)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Digital Clock Display for Active Shift */}
        {currentSession && (
          <div className="flex flex-col items-center justify-center px-6 py-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto min-w-[240px]">
            <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isOnDuty ? 'เวลาปฏิบัติงานสุทธิ' : 'หยุดนับเวลาชั่วคราว'}
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              {formatTime(dutyTime)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[0.7rem] text-slate-400">
              <Clock size={12} />
              <span>เริ่มเข้าเวร: {new Date(currentSession.clock_in).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
            </div>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="flex flex-col items-center xl:items-end gap-3 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!currentSession ? (
              <button 
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-600/25 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto" 
                onClick={(e) => { e.currentTarget.disabled = true; onClockIn(e); }} 
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin"/> กำลังดำเนินการ...</>
                ) : (
                  <><Play size={18} className="fill-white" /> ลงเวลาเข้าเวร</>
                )}
              </button>
            ) : (
              <>
                <button 
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                    isOnBreak
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  }`}
                  onClick={(e) => { e.currentTarget.disabled = true; onBreak(e); }} 
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin"/> กำลังดำเนินการ...</>
                  ) : isOnBreak ? (
                    <><RefreshCw size={18} /> กลับจากพักเบรก</>
                  ) : (
                    <><Pause size={18} className="fill-white" /> ขอพักเบรก</>
                  )}
                </button>
                <button 
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm shadow-md shadow-rose-600/20 hover:shadow-lg transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto" 
                  onClick={(e) => { e.currentTarget.disabled = true; onClockOut(e); }} 
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin"/> กำลังดำเนินการ...</>
                  ) : (
                    <><Square size={16} className="fill-white" /> ลงเวลาออกเวร</>
                  )}
                </button>
              </>
            )}
          </div>

          {isAdmin(profile?.role) && onSpecialDutyClick && (
            <button 
              onClick={onSpecialDutyClick}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-100 bg-purple-50 rounded-xl transition-all border border-purple-200 cursor-pointer w-full sm:w-auto shadow-sm"
            >
              <Gift size={14} className="text-purple-600" />
              มอบเวลาพิเศษ (สอบหมอ/พี่เลี้ยง)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
