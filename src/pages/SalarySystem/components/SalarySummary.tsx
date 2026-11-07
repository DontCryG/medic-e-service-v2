import type { SalaryResult } from '../utils/salaryCalculations';
import { Banknote, Users, TrendingUp, CheckCircle2 } from 'lucide-react';

interface SalarySummaryProps {
  data: SalaryResult[];
}

export default function SalarySummary({ data }: SalarySummaryProps) {
  if (!data) return null;

  const totalCash = data.reduce((sum, item) => sum + item.ic_salary + item.story_money + (item.mentor_money || 0), 0);
  const activeStaffCount = data.filter(item => item.total_hours > 0 || item.total_minutes > 0).length;
  const participationRate = data.length > 0 ? Math.round((activeStaffCount / data.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Total Salary Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-purple-50/40 border border-slate-200/80 border-l-4 border-l-purple-600 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">ยอดเงินรวม</span>
            </div>
            <h4 className="m-0 text-slate-600 text-sm font-semibold mb-2">ยอดเงินจ่ายรวม (IC สุทธิ)</h4>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-black text-purple-600 uppercase">IC</span>
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {totalCash.toLocaleString()}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <TrendingUp size={14} className="text-emerald-500 shrink-0" />
              <span>รวมค่าเวรปกติ + โบนัสสตอรี่ + ค่าพี่เลี้ยง</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
            <Banknote size={28} />
          </div>
        </div>
      </div>

      {/* Active Staff Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/40 border border-slate-200/80 border-l-4 border-l-emerald-600 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">บุคลากรปฏิบัติการ</span>
            </div>
            <h4 className="m-0 text-slate-600 text-sm font-semibold mb-2">บุคลากรที่เข้าเวรในรอบนี้</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {activeStaffCount}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {data.length} คน
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>คิดเป็น {participationRate}% ของบุคลากรทั้งหมดในระบบ</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Users size={28} />
          </div>
        </div>
      </div>
    </div>
  );
}
