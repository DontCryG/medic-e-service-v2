import type { SalaryResult } from '../utils/salaryCalculations';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SalaryReportModalProps {
  data: SalaryResult[];
  startDate: Date;
  endDate: Date;
  onClose: () => void;
}

export default function SalaryReportModal({ data, startDate, endDate, onClose }: SalaryReportModalProps) {
  const sortedData = data.filter(item => item.total_hours > 0 || item.total_minutes > 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const originalTitle = document.title;
    
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear();
    document.title = `Payslip-${d}-${m}-${y}`;

    let timer = setTimeout(() => {
      window.print();
    }, 500);
    
    const handleAfterPrint = () => {
      document.title = originalTitle;
      onClose();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      clearTimeout(timer);
      document.title = originalTitle;
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [startDate, onClose]);

  const modalContent = (
    <div className="fixed inset-0 z-[-9999] opacity-0 pointer-events-none print:opacity-100 print:z-[9999] print:bg-white print:static print:inset-auto print:block">
      <style>
        {`
          @media print {
            html, body {
              background-color: white !important;
              height: auto !important;
              min-height: 0 !important;
            }
            #root {
              display: none !important;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .modal-overlay {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: transparent !important;
              display: block !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .print-area {
              position: static !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background-color: white !important;
              padding: 20px !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              
              overflow: visible !important;
            }
            @page { size: landscape; margin: 0; }
          }

            .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
            font-size: 0.85rem;
          }
          
          .report-table th, .report-table td {
            border: 1px solid #e2e8f0;
            padding: 0.75rem 0.5rem;
            color: #334155;
          }

          
          
          .report-table th {
            background-color: #f8fafc;
            font-weight: 600;
            text-align: center;
            color: #475569;
          }

          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .close-btn {
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
          }
          .close-btn:hover {
            background: #f1f5f9;
            color: #0f172a;
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
          }

          .signature-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 200px;
          }
          
          .signature-line {
            width: 100%;
            border-bottom: 1px solid #0f172a;
            margin-bottom: 0.5rem;
            height: 40px;
          }
        `}
      </style>
      
      <div 
        className="print-area print-color-exact" 
        style={{ width: '100%', background: '#fff', padding: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        

        {/* Print Document Content */}
        <div style={{ color: '#0f172a' }}>
          <div className="flex flex-col items-center justify-center mb-8">
              <img src="/logo.png" alt="Hospital Logo" className="w-20 h-20 object-contain mb-4" />
              <div style={{ textAlign: 'center' }}>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">หน่วยงานแพทย์ (Medic Services)</h1>
            <h2 className="text-lg font-medium text-slate-500 mb-2">รายงานสรุปการคำนวณเงินเดือน และสวัสดิการบุคลากร</h2>
            <p className="text-sm text-slate-400 mb-8">ประจำรอบวันที่: {formatDate(startDate)} - {formatDate(endDate)}</p>
              </div>
            </div>

                              <table className="report-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: '16%' }}>ชื่อ-สกุล (IC)</th>
                <th rowSpan={2} style={{ width: '9%' }}>เวลาเข้าเวร</th>
                <th colSpan={4}>รายได้ (Income)</th>
                <th colSpan={6}>สวัสดิการ (Benefits)</th>
              </tr>
              <tr>
                <th style={{ width: '10%', whiteSpace: 'nowrap' }}>เงิน IC</th>
                <th style={{ width: '5%' }}>สตอรี่</th>
                <th style={{ width: '10%', whiteSpace: 'nowrap' }}>เงินสตอรี่</th>
                <th style={{ width: '10%', whiteSpace: 'nowrap' }}>เงินพี่เลี้ยง</th>
                <th style={{ width: '5%' }}>กาชา IC</th>
                <th style={{ width: '6%' }}>หน่วยงาน</th>
                <th style={{ width: '5%' }}>Prem.</th>
                <th style={{ width: '6%' }}>Promo.</th>
                <th style={{ width: '9%', whiteSpace: 'nowrap' }}>เงิน OC</th>
                <th style={{ width: '9%' }}>เหรียญ</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{item.ic_name}</div>
                    <div style={{ fontSize: '0.75rem' }}>{item.position_name}</div>
                  </td>
                  <td className="text-center" style={{ whiteSpace: 'nowrap' }}>{item.total_hours} ชม.<br/><span style={{ fontSize: '0.75rem' }}>({Math.floor(item.total_minutes / 60)}h {Math.floor(item.total_minutes % 60)}m)</span></td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>{item.ic_salary > 0 ? item.ic_salary.toLocaleString() : '-'}</td>
                  <td className="text-center">{item.story_count > 0 ? item.story_count : '-'}</td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>{item.story_money > 0 ? item.story_money.toLocaleString() : '-'}</td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>{item.mentor_money > 0 ? item.mentor_money.toLocaleString() : '-'}</td>
                  <td className="text-center">{item.gacha_ic > 0 ? item.gacha_ic : '-'}</td>
                  <td className="text-center">{item.agency_gacha > 0 ? item.agency_gacha : '-'}</td>
                  <td className="text-center">{item.gacha_premium > 0 ? item.gacha_premium : '-'}</td>
                  <td className="text-center">{item.gacha_promote > 0 ? item.gacha_promote : '-'}</td>
                  <td className="text-right" style={{ whiteSpace: 'nowrap' }}>{item.oc_money > 0 ? item.oc_money.toLocaleString() : '-'}</td>
                  <td className="text-center">{item.coins > 0 ? item.coins : '-'}</td>
                </tr>
              ))}
            
              <tr>
                <th colSpan={2} className="text-right">รวมทั้งสิ้น</th>
                <th className="text-right" style={{ whiteSpace: 'nowrap' }}>{sortedData.reduce((acc, curr) => acc + curr.ic_salary, 0).toLocaleString()}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.story_count, 0)}</th>
                <th className="text-right" style={{ whiteSpace: 'nowrap' }}>{sortedData.reduce((acc, curr) => acc + curr.story_money, 0).toLocaleString()}</th>
                <th className="text-right" style={{ whiteSpace: 'nowrap' }}>{sortedData.reduce((acc, curr) => acc + (curr.mentor_money || 0), 0).toLocaleString()}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.gacha_ic, 0)}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.agency_gacha, 0)}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.gacha_premium, 0)}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.gacha_promote, 0)}</th>
                <th className="text-right" style={{ whiteSpace: 'nowrap' }}>{sortedData.reduce((acc, curr) => acc + curr.oc_money, 0).toLocaleString()}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.coins, 0)}</th>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
