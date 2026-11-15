import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import { useMyWeeklyDutyStats } from '../hooks/useDutyQueries';

interface DutyWeeklyProgressProps {
  profile: any;
  currentSession: any;
  liveDutySeconds?: number;
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

function formatThaiDate(d: Date): string {
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
}

export default function DutyWeeklyProgress({
  profile,
  currentSession,
  liveDutySeconds = 0,
}: DutyWeeklyProgressProps) {
  // Target hours: default 20, persisted in localStorage
  const [targetHours, setTargetHours] = useState<number>(() => {
    const saved = localStorage.getItem('medic_duty_target_hours');
    return saved ? Number(saved) : 20;
  });

  const handleSetTarget = (h: number) => {
    setTargetHours(h);
    localStorage.setItem('medic_duty_target_hours', String(h));
  };

  const { data: stats, isLoading } = useMyWeeklyDutyStats(profile?.discord_id);

  // Live minutes from active duty shift (only if status is on_duty or on_break)
  const isShiftActive = currentSession?.status === 'on_duty' || currentSession?.status === 'on_break';
  const liveMinutes = currentSession?.status === 'on_duty' ? Math.floor(liveDutySeconds / 60) : 0;

  const completedMinutes = stats?.totalMinutes || 0;
  const totalAccumulatedMinutes = completedMinutes + liveMinutes;

  const totalAccumulatedHours = Math.floor(totalAccumulatedMinutes / 60);
  const remainingMinutes = totalAccumulatedMinutes % 60;

  const targetMinutes = targetHours * 60;
  const percentNumber = targetMinutes > 0 ? (totalAccumulatedMinutes / targetMinutes) * 100 : 0;
  const percentClamped = Math.min(100, Math.max(0, percentNumber));
  const percentDisplay = percentNumber.toFixed(1);

  const isCompleted = totalAccumulatedMinutes >= targetMinutes;
  const diffMinutes = Math.max(0, targetMinutes - totalAccumulatedMinutes);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffRemainingMins = diffMinutes % 60;

  const rangeLabel = stats?.startDate && stats?.endDate
    ? `${formatThaiDate(new Date(stats.startDate))} - ${formatThaiDate(new Date(stats.endDate))} ${new Date(stats.endDate).getFullYear() + 543}`
    : 'รอบสัปดาห์นี้';

  return (
    <div className="w-full bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-inner">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm border border-purple-200/50">
            <Target size={19} className="text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 tracking-tight m-0">
                ชั่วโมงเวรสะสมของตนเอง (รอบสัปดาห์นี้)
              </h3>
              {currentSession?.status === 'on_duty' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.68rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  กำลังนับเวลาสด
                </span>
              )}
            </div>
            <p className="text-[0.72rem] text-slate-500 font-medium m-0 mt-0.5">
              รอบวันจันทร์ - อาทิตย์ ({rangeLabel})
            </p>
          </div>
        </div>

        {/* Target Selector Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-xs shrink-0 self-start sm:self-auto">
          <span className="text-[0.7rem] font-bold text-slate-400 px-2 hidden sm:inline">
            เป้าหมาย:
          </span>
          <button
            type="button"
            onClick={() => handleSetTarget(20)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border-none ${
              targetHours === 20
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
            }`}
          >
            20 ชม. (เกณฑ์ผ่าน)
          </button>
          <button
            type="button"
            onClick={() => handleSetTarget(30)}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border-none ${
              targetHours === 30
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-transparent'
            }`}
          >
            30 ชม. (โบนัส)
          </button>
        </div>
      </div>

      {/* Main Stats Display */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {totalAccumulatedHours}{' '}
              <span className="text-sm font-bold text-slate-500 font-sans">ชม.</span>{' '}
              {remainingMinutes}{' '}
              <span className="text-sm font-bold text-slate-500 font-sans">นาที</span>
            </span>
            <span className="text-sm font-bold text-slate-400">
              / {targetHours} ชม.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-600" />
                ครบเป้าหมายแล้ว ({percentDisplay}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                <TrendingUp size={13} className="text-purple-600" />
                {percentDisplay}%
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar (หลอดเป้าหมาย) */}
        <div className="relative w-full h-4 bg-slate-200/90 rounded-full overflow-hidden p-0.5 border border-slate-300/70 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-sm shadow-emerald-500/30'
                : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-emerald-500'
            }`}
            style={{ width: `${Math.max(percentClamped > 0 ? 3 : 0, percentClamped)}%` }}
          >
            {/* Shimmer line */}
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Milestone Indicator Ticks */}
        <div className="flex justify-between items-center text-[0.68rem] text-slate-400 font-bold px-1">
          <span>0 ชม.</span>
          {targetHours === 20 ? (
            <>
              <span className={totalAccumulatedHours >= 10 ? 'text-purple-600 font-black' : ''}>10 ชม. (50%)</span>
              <span className={isCompleted ? 'text-emerald-600 font-black' : ''}>20 ชม. (เป้าหมาย 🎯)</span>
            </>
          ) : (
            <>
              <span className={totalAccumulatedHours >= 15 ? 'text-purple-600 font-black' : ''}>15 ชม. (50%)</span>
              <span className={totalAccumulatedHours >= 20 ? 'text-purple-600 font-black' : ''}>20 ชม. (เกณฑ์ผ่าน)</span>
              <span className={isCompleted ? 'text-emerald-600 font-black' : ''}>30 ชม. (โบนัส 🎯)</span>
            </>
          )}
        </div>

        {/* Summary Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-slate-500 pt-1.5 border-t border-slate-200/60">
          <div>
            {isCompleted ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600 shrink-0" />
                ยินดีด้วย! คุณปฏิบัติงานครบเป้าหมาย {targetHours} ชม. ประจำสัปดาห์นี้แล้ว
              </span>
            ) : (
              <span className="text-slate-600">
                ต้องการอีก{' '}
                <strong className="text-purple-700 font-bold">
                  {diffHours} ชม. {diffRemainingMins} นาที
                </strong>{' '}
                จะครบเป้าหมาย {targetHours} ชม.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[0.72rem] text-slate-500 flex-wrap">
            <span>
              เข้าเวรแล้ว:{' '}
              <strong className="text-slate-800">
                {(stats?.completedLogsCount || 0) + (isShiftActive ? 1 : 0)}
              </strong>{' '}
              รอบ
            </span>
            {(stats?.mentorMinutes || 0) > 0 && (
              <span>
                เวรพี่เลี้ยง:{' '}
                <strong className="text-slate-800">
                  {Math.floor((stats?.mentorMinutes || 0) / 60)} ชม.
                </strong>
              </span>
            )}
            {(stats?.specialMinutes || 0) > 0 && (
              <span>
                เวลาพิเศษ:{' '}
                <strong className="text-slate-800">
                  {Math.floor((stats?.specialMinutes || 0) / 60)} ชม.
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
