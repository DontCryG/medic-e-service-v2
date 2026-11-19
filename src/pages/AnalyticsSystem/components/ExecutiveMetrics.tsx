import { Banknote, Clock, Users, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ExecutiveKPIs } from '../types';

interface ExecutiveMetricsProps {
  kpis: ExecutiveKPIs;
  periodLabel: string;
}

export function ExecutiveMetrics({ kpis, periodLabel }: ExecutiveMetricsProps) {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(val);
  };

  const renderGrowthBadge = (percent: number) => {
    if (percent === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          <Minus size={12} />
          0.0%
        </span>
      );
    }
    const isPositive = percent > 0;
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
        isPositive 
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' 
          : 'text-rose-700 bg-rose-50 border-rose-200/60'
      }`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isPositive ? '+' : ''}{percent.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3 print:break-inside-avoid">
      {/* 1. Total Budget */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-purple-200 hover:shadow-xs transition-all print:p-4 print:shadow-none print:border-slate-300">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Banknote size={20} />
          </div>
          {renderGrowthBadge(kpis.budgetGrowthPercent)}
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-0.5">งบประมาณค่าตอบแทนรวม</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-400">฿</span>
            {formatMoney(kpis.totalBudget)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-medium flex items-center justify-between">
            <span>ช่วงก่อนหน้า: ฿{formatMoney(kpis.prevTotalBudget)}</span>
            <span className="text-slate-300">•</span>
            <span className="truncate">{periodLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. Total Duty Hours */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-emerald-200 hover:shadow-xs transition-all print:p-4 print:shadow-none print:border-slate-300">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          {renderGrowthBadge(kpis.hoursGrowthPercent)}
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-0.5">ชั่วโมงเวรรวมหน่วยงาน</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
            {kpis.totalDutyHours.toLocaleString('th-TH', { maximumFractionDigits: 1 })}
            <span className="text-xs font-bold text-slate-500">ชม.</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-medium flex items-center justify-between">
            <span>ช่วงก่อนหน้า: {kpis.prevTotalDutyHours.toLocaleString('th-TH', { maximumFractionDigits: 1 })} ชม.</span>
            <span className="text-slate-300">•</span>
            <span>เฉลี่ย {(kpis.totalDutyHours / 7).toFixed(1)} ชม./วัน</span>
          </div>
        </div>
      </div>

      {/* 3. Active Doctors */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-sky-200 hover:shadow-xs transition-all print:p-4 print:shadow-none print:border-slate-300">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
            {kpis.activeRatePercent}% Active
          </span>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-0.5">บุคลากรที่มีส่วนร่วมในเวร</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
            {kpis.activeDoctorsCount}
            <span className="text-xs font-bold text-slate-400">/ {kpis.totalDoctorsCount} คน</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-medium flex items-center justify-between">
            <span>กำลังพลที่ปฏิบัติการจริง</span>
            <span className="text-slate-300">•</span>
            <span>{kpis.totalDoctorsCount - kpis.activeDoctorsCount} คนหยุดพัก</span>
          </div>
        </div>
      </div>

      {/* 4. Cost Efficiency */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-amber-200 hover:shadow-xs transition-all print:p-4 print:shadow-none print:border-slate-300">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          {renderGrowthBadge(kpis.costPerHourGrowthPercent)}
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-0.5">ต้นทุนเฉลี่ยต่อชั่วโมงเวร</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-400">฿</span>
            {formatMoney(kpis.costPerHour)}
            <span className="text-xs font-bold text-slate-500">/ ชม.</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-medium flex items-center justify-between">
            <span>ช่วงก่อนหน้า: ฿{formatMoney(kpis.prevCostPerHour)}</span>
            <span className="text-slate-300">•</span>
            <span>ประสิทธิภาพงบประมาณ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
