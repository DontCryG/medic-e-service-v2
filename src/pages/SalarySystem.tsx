import { useState } from 'react';
import { CalendarDays, Download } from 'lucide-react';
import SmartDatePicker from '../components/common/SmartDatePicker';
import './SalarySystem.css';

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

  const handleExportCsv = () => {
    if (!salaryData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "ชื่อ-สกุล,ตำแหน่ง,เวลาทำงาน (ชั่วโมง),เวลาทำงาน (นาที),เงิน IC,สตอรี่ (เคส),เงินสตอรี่,เงิน OC,เงินโบนัส,กาชา IC,กาชา Promote,กาชาหน่วยงาน,เหรียญหน่วยงาน\n";
    
    salaryData.forEach(item => {
      const row = [
        item.ic_name,
        item.position_name,
        item.total_hours,
        item.total_minutes,
        item.ic_salary,
        item.story_count,
        item.story_money,
        item.oc_money,
        (item as any).bonus_cash || 0,
        item.gacha_ic,
        item.gacha_promote,
        item.agency_gacha,
        item.coins
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_${(startDate as Date).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    setIsReportOpen(true);
  };

  return (
    <div className="salary-system-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header and Controls */}
      <div className="salary-controls-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarDays size={20} color="#64748b" />
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>ตั้งแต่วันที่:</label>
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
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 0.5rem' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>ถึงวันที่:</label>
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

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExportCsv}
            disabled={!salaryData || salaryData.length === 0}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#64748b', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '12px', 
              cursor: (!salaryData || salaryData.length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(100,116,139,0.2)',
              opacity: (!salaryData || salaryData.length === 0) ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <Download size={18} /> ส่งออก CSV
          </button>
          
          <button 
            onClick={handlePrint}
            disabled={!salaryData || salaryData.length === 0}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '12px', 
              cursor: (!salaryData || salaryData.length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(239,68,68,0.2)',
              opacity: (!salaryData || salaryData.length === 0) ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            <Download size={18} /> พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ color: '#ef4444', background: '#fef2f2', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
        </div>
      ) : salaryData ? (
        <div id="salary-table-container">
          <SalarySummary data={salaryData} />
          
          <div style={{ marginTop: '2rem' }}>
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
