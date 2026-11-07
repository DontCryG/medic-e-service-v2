import { useState } from 'react';
import { CalendarDays, Printer, Banknote } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import SmartDatePicker from '../components/common/SmartDatePicker';
import TableSkeleton from '../components/common/TableSkeleton';

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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="ระบบคำนวณเงินเดือน (Salary System)"
        subtitle="สรุปชั่วโมงเวร คำนวณรายได้ IC/OC ค่าสตอรี่ และพิมพ์สลิปเงินเดือน"
        icon={<Banknote size={24} />}
        iconTheme="orange"
        badge={{ label: 'ระบบจัดการ (Admin Only)', variant: 'admin' }}
        actions={
          <button 
            onClick={handlePrint}
            disabled={!salaryData || salaryData.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-none text-white transition-all shadow-sm ${
              (!salaryData || salaryData.length === 0) 
                ? 'bg-purple-300 opacity-70 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 cursor-pointer hover:shadow'
            }`}
          >
            <Printer size={16} /> พิมพ์ / บันทึก PDF
          </button>
        }
      />

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-3">
          <CalendarDays size={18} className="text-purple-600 shrink-0" />
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">ตั้งแต่วันที่:</label>
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
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">ถึงวันที่:</label>
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

      {error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-xl text-center font-medium">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="h-6 w-48 bg-slate-200/80 rounded-md mb-6 animate-pulse" />
          <TableSkeleton rows={6} columns={6} />
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
