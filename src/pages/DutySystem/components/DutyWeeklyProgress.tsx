import React, { useState } from 'react';
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

  const { data: stats } = useMyWeeklyDutyStats(profile?.discord_id);

  // Live minutes from active duty shift
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
    <div className="w-full bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200/80">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200/60">
            <Target size={17} className="text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight m-0">
                ชั่วโมงเวรสะสมของตนเอง (รอบสัปดาห์นี้)
              </h3>
              {currentSession?.status === 'on_duty' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  กำลังนับเวลาสด
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-normal m-0 mt-0.5">
              รอบวันจันทร์ - อาทิตย์ ({rangeLabel})
            </p>
          </div>
        </div>

        {/* Target Selector Buttons */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/80 shrink-0 self-start sm:self-auto">
          <span className="text-[10px] font-semibold text-slate-400 px-1.5 hidden sm:inline">
            เป้าหมาย:
          </span>
          <button
            type="button"
            onClick={() => handleSetTarget(20)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border-none ${
              targetHours === 20
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 bg-transparent'
            }`}
          >
            20 ชม. (เกณฑ์ผ่าน)
          </button>
          <button
            type="button"
            onClick={() => handleSetTarget(30)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border-none ${
              targetHours === 30
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 bg-transparent'
            }`}
          >
            30 ชม. (โบนัส)
          </button>
        </div>
      </div>

      {/* Main Stats Display */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {totalAccumulatedHours}{' '}
              <span className="text-xs font-semibold text-slate-500 font-sans">ชม.</span>{' '}
              {remainingMinutes}{' '}
              <span className="text-xs font-semibold text-slate-500 font-sans">นาที</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {targetHours} ชม.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={13} className="text-emerald-600" />
                ครบเป้าหมายแล้ว ({percentDisplay}%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80">
                <TrendingUp size={12} className="text-purple-600" />
                {percentDisplay}%
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar (หลอดเป้าหมาย) */}
        <div className="relative w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-emerald-500'
            }`}
            style={{ width: `${Math.max(percentClamped > 0 ? 3 : 0, percentClamped)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>

        {/* Milestone Indicator Ticks */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-0.5">
          <span>0 ชม.</span>
          {targetHours === 20 ? (
            <>
              <span className={totalAccumulatedHours >= 10 ? 'text-purple-600 font-bold' : ''}>10 ชม. (50%)</span>
              <span className={isCompleted ? 'text-emerald-600 font-bold' : ''}>20 ชม. (เป้าหมาย 🎯)</span>
            </>
          ) : (
            <>
              <span className={totalAccumulatedHours >= 15 ? 'text-purple-600 font-bold' : ''}>15 ชม. (50%)</span>
              <span className={totalAccumulatedHours >= 20 ? 'text-purple-600 font-bold' : ''}>20 ชม. (เกณฑ์ผ่าน)</span>
              <span className={isCompleted ? 'text-emerald-600 font-bold' : ''}>30 ชม. (โบนัส 🎯)</span>
            </>
          )}
        </div>

        {/* Summary Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 pt-1.5 border-t border-slate-200/60">
          <div>
            {isCompleted ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-xs">
                <Sparkles size={13} className="text-emerald-600 shrink-0" />
                ยินดีด้วย! ปฏิบัติงานครบเป้าหมาย {targetHours} ชม. ประจำสัปดาห์นี้แล้ว
              </span>
            ) : (
              <span className="text-slate-600 text-xs">
                ต้องการอีก{' '}
                <strong className="text-purple-700 font-bold">
                  {diffHours} ชม. {diffRemainingMins} นาที
                </strong>{' '}
                จะครบเป้าหมาย {targetHours} ชม.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
            <span>
              เข้าเวรแล้ว:{' '}
              <strong className="text-slate-800">
                {(stats?.completedLogsCount || 0) + (isShiftActive ? 1 : 0)}
              </strong>{' '}
              รอบ
            </span>
            {(stats?.mentorMinutes || 0) > 0 && (
              <span>
                พี่เลี้ยง:{' '}
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
