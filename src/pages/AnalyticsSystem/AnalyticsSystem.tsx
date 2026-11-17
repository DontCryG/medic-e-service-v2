import { useState } from 'react';
import { 
  TrendingUp, 
  RotateCw, 
  Printer, 
  Calendar, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import SmartDatePicker from '@/components/common/SmartDatePicker';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { ExecutiveMetrics } from './components/ExecutiveMetrics';
import { ShortageInsights } from './components/ShortageInsights';
import { DutyHeatmap } from './components/DutyHeatmap';
import { BudgetGrowthChart } from './components/BudgetGrowthChart';
import type { DateRangePreset } from './types';

export function AnalyticsSystem() {
  const [preset, setPreset] = useState<DateRangePreset>('this_week');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  const { data, isLoading, error, refetch, isFetching } = useAnalyticsData(
    preset,
    customStart,
    customEnd
  );

  const getPresetLabel = (p: DateRangePreset) => {
    switch (p) {
      case 'this_week': return 'สัปดาห์นี้';
      case 'last_week': return 'สัปดาห์ก่อนหน้า';
      case 'this_month': return 'เดือนนี้';
      case 'last_month': return 'เดือนที่แล้ว';
      case 'last_30_days': return '30 วันย้อนหลัง';
      case 'custom': return 'กำหนดช่วงวันเอง';
      default: return '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="สถิติและภาพรวมองค์กร (BI & Analytics)"
        subtitle="วิเคราะห์ความหนาแน่นการเข้าเวร (Heatmap) แนวโน้มการเติบโต และการจัดสรรงบประมาณค่าตอบแทนแพทย์"
        icon={<TrendingUp size={18} />}
        iconTheme="purple"
        badge={{
          label: 'Executive Intelligence',
          variant: 'live'
        }}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 print:hidden">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RotateCw size={14} className={`text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
              <span>อัปเดต</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="พิมพ์รายงานสรุป"
            >
              <Printer size={14} className="text-slate-500" />
              <span>พิมพ์รายงาน</span>
            </button>
          </div>
        }
      />

      {/* Date Range Selector Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        {/* Preset Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Calendar size={13} />
            ช่วงเวลา:
          </span>

          {(['this_week', 'last_week', 'this_month', 'last_month', 'last_30_days', 'custom'] as DateRangePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                preset === p
                  ? 'bg-purple-50 text-purple-700 border-purple-200/80 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {getPresetLabel(p)}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers (Shown if preset === 'custom') */}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
            <div className="w-36">
              <SmartDatePicker
                selected={customStart || null}
                onChange={(d: Date | null) => setCustomStart(d || undefined)}
                placeholderText="วันเริ่มต้น"
                className="w-full text-xs"
              />
            </div>
            <span className="text-slate-400 text-xs">-</span>
            <div className="w-36">
              <SmartDatePicker
                selected={customEnd || null}
                onChange={(d: Date | null) => setCustomEnd(d || undefined)}
                placeholderText="วันสิ้นสุด"
                className="w-full text-xs"
              />
            </div>
          </div>
        )}

        {/* Date Display Pill */}
        {data && (
          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 flex items-center gap-1.5 self-start lg:self-auto">
            <Clock size={13} className="text-purple-600" />
            <span>
              {data.dateRange.startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} -{' '}
              {data.dateRange.endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-slate-400 font-mono">({data.dateRange.daysCount} วัน)</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="h-72 bg-slate-100 rounded-xl" />
          <div className="h-72 bg-slate-100 rounded-xl" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 flex flex-col items-center gap-2">
          <AlertCircle size={32} className="text-rose-500" />
          <h3 className="text-sm font-bold m-0">เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ</h3>
          <p className="text-xs text-rose-600 m-0">{(error as Error).message}</p>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-6">
          {/* 1. Executive Metrics KPI Cards */}
          <ExecutiveMetrics 
            kpis={data.kpis} 
            periodLabel={getPresetLabel(preset)} 
          />

          {/* 2. Staffing & Shortage Insights */}
          <ShortageInsights insights={data.insights} />

          {/* 3. 7x24 Duty Coverage Heatmap */}
          <DutyHeatmap matrix={data.heatmapMatrix} />

          {/* 4. Budget & Growth Analytics Chart */}
          <BudgetGrowthChart
            trendData={data.trendData}
            positionBreakdown={data.positionBreakdown}
            totalBudget={data.kpis.totalBudget}
            totalHours={data.kpis.totalDutyHours}
          />
        </div>
      ) : null}
    </div>
  );
}

export default AnalyticsSystem;
