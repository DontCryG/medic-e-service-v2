import type { SalaryResult } from '../utils/salaryCalculations';
import { Banknote, Users } from 'lucide-react';

interface SalarySummaryProps {
  data: SalaryResult[];
}

export default function SalarySummary({ data }: SalarySummaryProps) {
  if (!data) return null;

  const totalCash = data.reduce((sum, item) => sum + item.ic_salary + item.story_money + (item.mentor_money || 0), 0);
  const activeStaffCount = data.filter(item => item.total_hours > 0).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-purple-100 text-[var(--primary)]">
          <Banknote size={32} />
        </div>
        <div className="flex flex-col">
          <h4 className="m-0 mb-1.5 text-slate-500 text-[0.95rem] font-medium">ยอดเงินจ่ายรวม (IC สุทธิ)</h4>
          <p className="m-0 text-3xl font-bold text-slate-800">{totalCash.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
          <Users size={32} />
        </div>
        <div className="flex flex-col">
          <h4 className="m-0 mb-1.5 text-slate-500 text-[0.95rem] font-medium">บุคลากรที่เข้าเวรในรอบนี้</h4>
          <p className="m-0 text-3xl font-bold text-slate-800">{activeStaffCount} <span className="text-xl font-normal text-slate-400">/ {data.length} คน</span></p>
        </div>
      </div>
    </div>
  );
}
