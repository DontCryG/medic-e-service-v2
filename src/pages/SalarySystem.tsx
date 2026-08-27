import { useState } from 'react';
import { CalendarDays, Printer } from 'lucide-react';
import SmartDatePicker from '../components/common/SmartDatePicker';

import SalarySummary from './SalarySystem/components/SalarySummary';
import SalaryTable from './SalarySystem/components/SalaryTable';
import DutyLogEditModal from './SalarySystem/components/DutyLogEditModal';
import SalaryReportModal from './SalarySystem/components/SalaryReportModal';
import PayslipModal from './SalarySystem/components/PayslipModal';
import { useSalaryData } from './SalarySystem/hooks/useSalaryQueries';
import { useSalaryRealtime } from './SalarySystem/hooks/useSalaryRealtime';

export interface SalarySystemProps {
  profile: any;
}

export default function SalarySystem({ profile: _profile }: SalarySystemProps) {
  // Real-time synchronization
  useSalaryRealtime();

  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  });
  
  const [dutyLogModalUser, setDutyLogModalUser] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [payslipUser, setPayslipUser] = useState<any>(null);

  const { data: salaryData, isLoading, error } = useSalaryData(startDate as Date, endDate as Date);

  const handlePrint = () => {
    setIsReportOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 px-6 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <CalendarDays size={20} className="text-[var(--primary)]" />
            <label className="text-[0.95rem] text-slate-500 font-semibold whitespace-nowrap">ตั้งแต่วันที่:</label>
            <SmartDatePicker
              selected={startDate}
              onChange={(date: Date | null) => {
                if (date) {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  setStartDate(d);
                } else {
                  setStartDate(null);
                }
              }}
              className="date-picker-input"
            />
          </div>
          <div className="w-[1px] h-6 bg-slate-200 mx-2 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <label className="text-[0.95rem] text-slate-500 font-semibold whitespace-nowrap">ถึงวันที่:</label>
            <SmartDatePicker
              selected={endDate}
              onChange={(date: Date | null) => {
                if (date) {
                  const d = new Date(date);
                  d.setHours(23, 59, 59, 999);
                  setEndDate(d);
                } else {
                  setEndDate(null);
                }
              }}
              className="date-picker-input"
              minDate={startDate || undefined}
            />
          </div>
        </div>

        <div className="flex gap-3">
          
          <button 
            onClick={handlePrint}
            disabled={!salaryData || salaryData.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-[0.95rem] border-none text-white transition-all shadow-sm ${(!salaryData || salaryData.length === 0) ? 'bg-purple-300 opacity-70 cursor-not-allowed' : 'bg-[var(--primary)] hover:brightness-110 cursor-pointer hover:-translate-y-0.5'}`}
          >
            <Printer size={18} /> พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-xl text-center font-medium">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="flex justify-center p-16">
          <div className="spinner"></div>
        </div>
      ) : salaryData ? (
        <div id="salary-table-container">
          <SalarySummary data={salaryData} />
          
          <div className="mt-8">
            <SalaryTable 
              data={salaryData} 
              onOpenDutyLogModal={setDutyLogModalUser}
              onPrintPayslip={setPayslipUser}
            />
          </div>
        </div>
      ) : null}

      {dutyLogModalUser && (
        <DutyLogEditModal 
          user={dutyLogModalUser}
          startDate={startDate as Date}
          endDate={endDate as Date}
          onClose={() => setDutyLogModalUser(null)}
        />
      )}

      {isReportOpen && salaryData && (
        <SalaryReportModal 
          data={salaryData}
          startDate={startDate as Date}
          endDate={endDate as Date}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {payslipUser && (
        <PayslipModal
          user={payslipUser}
          startDate={startDate as Date}
          endDate={endDate as Date}
          onClose={() => setPayslipUser(null)}
        />
      )}
    </div>
  );
}
