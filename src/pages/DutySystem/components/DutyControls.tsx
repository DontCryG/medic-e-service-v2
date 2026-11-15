import DutyWeeklyProgress from "./DutyWeeklyProgress";
import { Play, Pause, Square, Clock, RefreshCw, Loader2, Gift, Coffee } from "lucide-react";
import { formatTime, getInitial } from "../utils/dutyUtils";
import { useDutyTimer, MAX_BREAK_SECONDS } from "../hooks/useDutyTimer";
import { isAdmin } from "@/utils/permissions";

interface DutyControlsProps {
  profile: any;
  avatarUrl: string | null;
  currentSession: any;
  loading: boolean;
  onClockIn: (e?: any) => void;
  onBreak: (e?: any) => void;
  onClockOut: (e?: any) => void;
  onBreakTimeout?: () => void;
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
  onBreakTimeout,
  onSpecialDutyClick
}: DutyControlsProps) {
  const { dutyTime, breakElapsedSeconds, breakRemainingSeconds } = useDutyTimer(currentSession, { onBreakTimeout });
  const isOnDuty = currentSession?.status === "on_duty";
  const isOnBreak = currentSession?.status === "on_break";

  const clockInFormatted = currentSession?.clock_in
    ? new Date(currentSession.clock_in).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
    : "-";

  const isBreakCritical = breakRemainingSeconds <= 180; // less than 3 minutes
  const breakPercent = Math.min(100, Math.max(0, (breakElapsedSeconds / MAX_BREAK_SECONDS) * 100));

  return (
    <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-5">
        
        {/* Doctor Info Section */}
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 w-full xl:w-auto">
          <div className="relative shrink-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black overflow-hidden border transition-all ${
              isOnDuty 
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20" 
                : isOnBreak 
                ? "border-amber-500/40 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20" 
                : "border-slate-200 bg-slate-100 text-slate-700"
            }`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitial(profile?.ic_name)
              )}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              isOnDuty ? "bg-emerald-500" : isOnBreak ? "bg-amber-500" : "bg-slate-300"
            }`} />
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 tracking-tight">
                {profile?.ic_name}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/70">
                {profile?.position?.name || "แพทย์"}
              </span>
            </div>
            
            <p className="text-slate-400 text-[11px] font-mono mt-0.5 m-0">
              ID: {profile?.discord_id}
            </p>

            <div className="mt-1.5 flex items-center gap-2">
              {isOnDuty && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  กำลังปฏิบัติหน้าที่ (ON DUTY)
                </span>
              )}
              {isOnBreak && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  กำลังพักเบรก (ON BREAK)
                </span>
              )}
              {!currentSession && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  อยู่นอกเวลาเวร (OFF DUTY)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry Timer Display for Active Shift */}
        {currentSession && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Duty Timer (Active or Paused) */}
            <div className="flex flex-col items-center justify-center px-5 py-3 bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs w-full sm:w-auto min-w-[200px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                {isOnDuty ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      เวลาปฏิบัติหน้าที่สุทธิ
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      เวลาเวร (พักชั่วคราว)
                    </span>
                  </>
                )}
              </div>

              <div className={`font-mono text-2xl sm:text-3xl font-black tracking-widest tabular-nums my-0.5 ${
                isOnDuty ? "text-slate-900" : "text-slate-500"
              }`}>
                {formatTime(dutyTime)}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Clock size={11} className="text-slate-400 shrink-0" />
                <span>เข้าเวร: {clockInFormatted} น.</span>
              </div>
            </div>

            {/* Break Remaining Countdown Card */}
            {isOnBreak && (
              <div className={`flex flex-col items-center justify-center px-5 py-3 rounded-2xl border shadow-2xs w-full sm:w-auto min-w-[210px] transition-all ${
                isBreakCritical
                  ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-200"
                  : "bg-gradient-to-b from-amber-50/60 to-amber-50/90 border-amber-200/90"
              }`}>
                <div className="flex items-center justify-between w-full gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <Coffee size={13} className={isBreakCritical ? "text-rose-600" : "text-amber-600"} />
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      isBreakCritical ? "text-rose-700 font-extrabold" : "text-amber-800"
                    }`}>
                      เวลาพักคงเหลือ
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isBreakCritical ? "bg-rose-200/80 text-rose-800" : "bg-amber-200/70 text-amber-800"
                  }`}>
                    15 นาที
                  </span>
                </div>

                <div className={`font-mono text-2xl sm:text-3xl font-black tracking-widest tabular-nums my-0.5 ${
                  isBreakCritical ? "text-rose-600 animate-pulse" : "text-amber-900"
                }`}>
                  {formatTime(breakRemainingSeconds)}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden my-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBreakCritical ? "bg-rose-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${breakPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between w-full text-[10px] px-0.5">
                  <span className={isBreakCritical ? "text-rose-700 font-bold" : "text-amber-700 font-medium"}>
                    {isBreakCritical ? "⚠️ ใกล้ครบ 15 นาที ออกเวรอัตโนมัติ" : `พักแล้ว ${Math.floor(breakElapsedSeconds / 60)} นาที`}
                  </span>
                  <span className={`font-semibold ${isBreakCritical ? "text-rose-700" : "text-amber-700/80"}`}>
                    เหลือ {Math.ceil(breakRemainingSeconds / 60)} น.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="flex flex-col items-center xl:items-end gap-2.5 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            {!currentSession ? (
              <button 
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto" 
                onClick={(e) => { e.currentTarget.disabled = true; onClockIn(e); }} 
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin"/> กำลังดำเนินการ...</>
                ) : (
                  <><Play size={15} className="fill-white" /> ลงเวลาเข้าเวร</>
                )}
              </button>
            ) : (
              <>
                <button 
                  className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                    isOnBreak
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                  onClick={(e) => { e.currentTarget.disabled = true; onBreak(e); }} 
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin"/> กำลังดำเนินการ...</>
                  ) : isOnBreak ? (
                    <><RefreshCw size={14} /> กลับจากพักเบรก</>
                  ) : (
                    <><Coffee size={14} /> ขอพักเบรก (15 นาที)</>
                  )}
                </button>
                <button 
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto" 
                  onClick={(e) => { e.currentTarget.disabled = true; onClockOut(e); }} 
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin"/> กำลังดำเนินการ...</>
                  ) : (
                    <><Square size={13} className="fill-white" /> ลงเวลาออกเวร</>
                  )}
                </button>
              </>
            )}
          </div>

          {isAdmin(profile?.role) && onSpecialDutyClick && (
            <button 
              onClick={onSpecialDutyClick}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-100/70 bg-purple-50 rounded-xl transition-colors border border-purple-200/70 cursor-pointer w-full sm:w-auto shadow-2xs"
            >
              <Gift size={13} className="text-purple-600" />
              มอบเวลาพิเศษ (สอบหมอ/พี่เลี้ยง)
            </button>
          )}
        </div>
      </div>

      {/* Weekly Duty Hours Progress Bar */}
      <div className="mt-5 pt-5 border-t border-slate-100">
        <DutyWeeklyProgress
          profile={profile}
          currentSession={currentSession}
          liveDutySeconds={dutyTime}
        />
      </div>
    </div>
  );
}