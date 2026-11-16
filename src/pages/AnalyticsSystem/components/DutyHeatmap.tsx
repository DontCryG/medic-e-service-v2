import React, { useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import type { HeatmapCell } from '../types';
import { THAI_DAYS } from '../utils/analyticsCalculations';

interface DutyHeatmapProps {
  matrix: HeatmapCell[][];
}

export function DutyHeatmap({ matrix }: DutyHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getCellClasses = (level: HeatmapCell['densityLevel']) => {
    switch (level) {
      case 0:
        return 'bg-slate-100/60 border-slate-200/50 text-slate-300 hover:border-slate-400';
      case 1:
        return 'bg-rose-100/90 border-rose-200 text-rose-800 font-semibold hover:border-rose-400 hover:scale-105';
      case 2:
        return 'bg-amber-100/90 border-amber-200 text-amber-800 font-semibold hover:border-amber-400 hover:scale-105';
      case 3:
        return 'bg-emerald-100/90 border-emerald-200 text-emerald-800 font-bold hover:border-emerald-400 hover:scale-105';
      case 4:
        return 'bg-purple-600 border-purple-700 text-white font-extrabold shadow-2xs hover:border-purple-800 hover:scale-105';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, cell: HeatmapCell) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
    setHoveredCell(cell);
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col gap-4">
      {/* Header & Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200/60">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 m-0 leading-tight">
              ความหนาแน่นการเข้าเวรตลอดสัปดาห์ (7×24 Duty Coverage Heatmap)
            </h3>
            <p className="text-[11px] text-slate-500 m-0 font-normal">
              แสดงจำนวนแพทย์ที่เข้าเวรเฉลี่ยพร้อมกันในแต่ละชั่วโมง เพื่อวิเคราะห์หาช่วงเวลาที่ขาดแคลนและช่วงเวลาเร่งด่วน
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shrink-0">
          <span className="text-slate-400 font-normal">ระดับกำลังพล:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 inline-block" /> 0 คน
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-200 border border-rose-300 inline-block" /> &lt; 1.5 คน (วิกฤต)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-200 border border-amber-300 inline-block" /> 1.5 - 3.5 คน
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300 inline-block" /> 3.5 - 5.5 คน
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-purple-600 border border-purple-700 inline-block" /> &gt; 5.5 คน (สูงสุด)
          </span>
        </div>
      </div>

      {/* 7x24 Heatmap Grid Table */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[780px] flex flex-col gap-1.5 select-none">
          
          {/* Hours Header Row */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 pl-16">
            {Array.from({ length: 24 }).map((_, h) => (
              <div 
                key={h} 
                className="flex-1 text-center font-mono py-0.5"
                title={`${h.toString().padStart(2, '0')}:00 น.`}
              >
                {h % 2 === 0 ? h.toString().padStart(2, '0') : '•'}
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {matrix.map((row, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-1">
              {/* Day Label Column */}
              <div className="w-16 text-right pr-3 text-xs font-bold text-slate-700 truncate shrink-0">
                {THAI_DAYS[dayIdx]}
              </div>

              {/* 24 Hour Cells */}
              <div className="flex-1 flex items-center gap-1">
                {row.map((cell) => (
                  <div
                    key={cell.hour}
                    onMouseEnter={(e) => handleMouseEnter(e, cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`flex-1 h-7 rounded border transition-all duration-100 flex items-center justify-center text-[10px] cursor-pointer ${getCellClasses(
                      cell.densityLevel
                    )}`}
                  >
                    {cell.avgDoctors > 0 ? (
                      <span className="scale-90 font-mono">
                        {cell.avgDoctors >= 10 ? Math.round(cell.avgDoctors) : cell.avgDoctors.toFixed(1)}
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Timeline Bar Sub-indicator */}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 pl-16 pt-1">
            <div className="w-1/4 text-center border-t border-slate-200 pt-1">ช่วงดึก (00:00 - 06:00)</div>
            <div className="w-1/4 text-center border-t border-slate-200 pt-1">ช่วงเช้า (06:00 - 12:00)</div>
            <div className="w-1/4 text-center border-t border-slate-200 pt-1">ช่วงบ่าย (12:00 - 18:00)</div>
            <div className="w-1/4 text-center border-t border-slate-200 pt-1 text-purple-700 font-bold">ช่วงค่ำ/ดึก (18:00 - 24:00)</div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-700 text-xs w-60 animate-in fade-in duration-100"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
            <span className="font-bold text-purple-300">
              วัน{hoveredCell.dayName}
            </span>
            <span className="font-mono text-slate-300">
              {hoveredCell.hourLabel} - {(hoveredCell.hour + 1).toString().padStart(2, '0')}:00 น.
            </span>
          </div>

          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">แพทย์ปฏิบัติหน้าที่เฉลี่ย:</span>
              <span className="font-bold text-white text-sm">
                {hoveredCell.avgDoctors} คน
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ชั่วโมงเวรรวมสะสม:</span>
              <span className="font-semibold text-slate-200">
                {hoveredCell.totalDutyHours} ชม.
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">จำนวนแพทย์ที่เคยเข้าเวร:</span>
              <span className="font-semibold text-slate-200">
                {hoveredCell.uniqueDoctorCount} คน
              </span>
            </div>
          </div>

          {hoveredCell.densityLevel === 0 && (
            <div className="mt-2 text-[10px] text-rose-400 bg-rose-950/60 p-1.5 rounded flex items-center gap-1">
              <Info size={12} className="shrink-0" />
              <span>ไม่มีแพทย์เข้าเวรในช่วงเวลานี้ (เสี่ยงเคสตกค้าง)</span>
            </div>
          )}
          {hoveredCell.densityLevel === 4 && (
            <div className="mt-2 text-[10px] text-purple-300 bg-purple-950/60 p-1.5 rounded flex items-center gap-1">
              <Info size={12} className="shrink-0" />
              <span>ช่วงเวลากำลังพลหนาแน่นสูงสุด (Peak Duty)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
