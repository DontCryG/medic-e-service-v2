import { useState } from 'react';
import { TrendingUp, BarChart3, Layers } from 'lucide-react';
import type { TrendDataPoint, PositionBudgetBreakdown } from '../types';

interface BudgetGrowthChartProps {
  trendData: TrendDataPoint[];
  positionBreakdown: PositionBudgetBreakdown[];
  totalBudget: number;
  totalHours: number;
}

export function BudgetGrowthChart({
  trendData,
  positionBreakdown,
  totalBudget,
  totalHours
}: BudgetGrowthChartProps) {
  const [activeTab, setActiveTab] = useState<'trend' | 'positions'>('trend');
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(val);
  };

  // Find max values for chart scaling
  const maxBudget = Math.max(...trendData.map(d => d.budget), 1000);
  const maxHours = Math.max(...trendData.map(d => d.hours), 10);

  // SVG Chart dimensions
  const chartHeight = 220;
  const paddingBottom = 40;
  const paddingTop = 20;
  const innerHeight = chartHeight - paddingBottom - paddingTop;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col gap-4">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0 leading-tight">
              สถิติการเติบโตและงบประมาณค่าตอบแทน (Growth & Budget Analytics)
            </h3>
            <p className="text-[11px] text-slate-500 m-0 font-normal">
              วิเคราะห์แนวโน้มการใช้งบประมาณเทียบกับเวลาปฏิบัติหน้าที่ และสัดส่วนค่าตอบแทนตามสายงาน
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === 'trend'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={13} />
            <span>แนวโน้มเติบโต (Timeline Trend)</span>
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === 'positions'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={13} />
            <span>สัดส่วนตามตำแหน่ง (By Position)</span>
          </button>
        </div>
      </div>

      {activeTab === 'trend' ? (
        <div className="flex flex-col gap-4">
          {/* Summary Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-600 inline-block" />
                <span className="text-slate-600 font-medium">งบประมาณค่าตอบแทน (฿)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded bg-emerald-500 inline-block" />
                <span className="text-slate-600 font-medium">ชั่วโมงเวรรวม (ชม.)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              รวม {formatMoney(totalBudget)} บาท • {totalHours} ชั่วโมง
            </div>
          </div>

          {/* Dual-axis SVG / Responsive Bar Chart */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[640px] relative h-[250px] flex flex-col justify-end pt-6">
              
              {/* Grid Background Lines */}
              <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-dashed border-slate-100 w-full" />
                <div className="border-b border-dashed border-slate-100 w-full" />
                <div className="border-b border-dashed border-slate-100 w-full" />
                <div className="border-b border-slate-200 w-full" />
              </div>

              {/* Bars & Points Container */}
              <div className="relative flex-1 flex items-end justify-between gap-2 px-6">
                {trendData.map((d, idx) => {
                  const barHeightPercent = maxBudget > 0 ? (d.budget / maxBudget) * 100 : 0;
                  const hoursHeightPercent = maxHours > 0 ? (d.hours / maxHours) * 100 : 0;
                  const isHovered = hoveredPoint?.key === d.key;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredPoint(d)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
                    >
                      {/* Hours Line Dot */}
                      <div
                        className={`absolute w-3 h-3 rounded-full border-2 border-white transition-all z-20 ${
                          isHovered 
                            ? 'bg-emerald-600 scale-125 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300' 
                            : 'bg-emerald-500 shadow-2xs'
                        }`}
                        style={{
                          bottom: `calc(${hoursHeightPercent}% * 0.8 + 40px)`
                        }}
                      />

                      {/* Budget Bar */}
                      <div
                        className={`w-full max-w-[42px] rounded-t-lg transition-all duration-150 ${
                          isHovered 
                            ? 'bg-purple-700 shadow-md shadow-purple-500/20 scale-y-105' 
                            : 'bg-purple-500/80 hover:bg-purple-600'
                        }`}
                        style={{
                          height: `max(6px, ${barHeightPercent * 0.8}%)`
                        }}
                      />

                      {/* X-axis Label */}
                      <div className="h-9 flex flex-col items-center justify-center pt-2">
                        <span className={`text-[11px] font-semibold truncate transition-colors text-center ${
                          isHovered ? 'text-purple-700 font-bold' : 'text-slate-500'
                        }`}>
                          {d.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg px-3.5 py-2 shadow-lg border border-slate-700 text-xs flex items-center gap-4 z-30 animate-in fade-in duration-100">
                  <span className="font-bold text-purple-300">{hoveredPoint.label}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">งบประมาณ:</span>
                    <span className="font-bold text-emerald-400">฿{formatMoney(hoveredPoint.budget)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">เวลาเวร:</span>
                    <span className="font-bold text-white">{hoveredPoint.hours} ชม.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">แพทย์:</span>
                    <span className="font-bold text-sky-300">{hoveredPoint.activeDoctors} คน</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Position Budget Breakdown Tab */
        <div className="flex flex-col gap-3 py-1">
          <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>การกระจายงบประมาณตามตำแหน่งงาน</span>
            <span className="text-[11px] text-slate-400 font-normal">เรียงตามสายงานและสัดส่วนงบประมาณ</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {positionBreakdown.map((pos, idx) => (
              <div 
                key={idx}
                className="bg-slate-50/70 hover:bg-slate-100/70 rounded-xl p-3.5 border border-slate-200/70 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{pos.positionName}</span>
                    <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {pos.doctorCount} คน
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-slate-500 font-medium">{pos.totalHours} ชม.</span>
                    <span className="text-slate-900">฿{formatMoney(pos.totalBudget)}</span>
                    <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60 font-mono">
                      {pos.percentOfTotal}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(2, pos.percentOfTotal))}%` }}
                  />
                </div>
              </div>
            ))}

            {positionBreakdown.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                ไม่มีข้อมูลตำแหน่งงานในช่วงเวลานี้
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
