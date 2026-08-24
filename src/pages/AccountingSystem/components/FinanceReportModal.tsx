import { Printer, X } from 'lucide-react';
import { useFinanceLogs } from '../hooks/useAccountingQueries';

interface FinanceReportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
}

export default function FinanceReportModal({ onClose, startDate, endDate }: FinanceReportModalProps) {
  const { data: logs = [] } = useFinanceLogs();

  // Filter logs by date range for the report
  const filteredLogs = logs.filter(log => {
    if (!startDate && !endDate) return true;
    const logDate = new Date(log.created_at);
    logDate.setHours(0, 0, 0, 0);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      if (logDate > end) return false;
    }
    return true;
  });

  const totalIncome = filteredLogs.filter(l => l.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredLogs.filter(l => l.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const periodBalance = totalIncome - totalExpense;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .modal-overlay {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              background: transparent !important;
              display: block !important;
              padding: 0 !important;
              overflow: visible !important;
              height: auto !important;
            }
            .print-area {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
            @page { size: portrait; margin: 1cm; }
          }

          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
            font-size: 0.85rem;
            table-layout: fixed;
            word-break: break-word;
          }
          
          .report-table th, .report-table td {
            border: 1px solid #1e293b;
            padding: 0.5rem;
            color: #0f172a;
          }
          
          .report-table th {
            background-color: #f8fafc;
            font-weight: bold;
            text-align: center;
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
        className="print-area" 
        style={{ width: '100%', maxWidth: '900px', padding: '2.5rem', background: '#fff', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header no-print">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', margin: 0 }}>
            <Printer size={24} /> ตัวอย่างก่อนพิมพ์ (รายงานการเงิน)
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handlePrint}
              style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Printer size={18} /> พิมพ์รายงาน
            </button>
            <button className="close-btn" onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        {/* Print Document Content */}
        <div style={{ color: '#0f172a' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>หน่วยงานแพทย์ (Medic Services)</h1>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', fontWeight: 'normal' }}>รายงานสรุปบัญชีการเงินหน่วยงานแพทย์</h2>
            <p style={{ margin: 0, fontSize: '1rem' }}>
              {(startDate || endDate) 
                ? `ข้อมูลสรุปตั้งแต่วันที่ ${startDate ? new Date(startDate).toLocaleDateString('th-TH') : '-'} ถึง ${endDate ? new Date(endDate).toLocaleDateString('th-TH') : 'ปัจจุบัน'}`
                : `ข้อมูลสรุปประจำวันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`
              }
            </p>
          </div>

          {/* Section 1: Summary */}
          <table className="report-table" style={{ width: '60%', margin: '0 auto 2rem auto' }}>
            <thead>
              <tr>
                <th colSpan={2}>สรุปยอดรวม (ในช่วงเวลาที่กำหนด)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>รายรับรวม</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>{totalIncome.toLocaleString()}</td>
              </tr>
              <tr>
                <td>รายจ่ายรวม</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>{totalExpense.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>ส่วนต่างยอดเงิน</td>
                <td className="text-right" style={{ fontWeight: 'bold' }}>{periodBalance.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: Statement */}
          <table className="report-table">
            <thead>
              <tr>
                <th colSpan={4}>รายการเคลื่อนไหว</th>
              </tr>
              <tr>
                <th style={{ width: '15%' }}>วันที่-เวลา</th>
                <th>รายละเอียด</th>
                <th style={{ width: '15%' }}>ประเภท</th>
                <th style={{ width: '20%' }}>จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>ไม่มีรายการเคลื่อนไหว</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="text-center">
                      {new Date(log.created_at).toLocaleDateString('th-TH')}
                      <br/>
                      <span style={{ fontSize: '0.85em', color: '#64748b' }}>{new Date(log.created_at).toLocaleTimeString('th-TH')}</span>
                    </td>
                    <td>{log.description || '-'}</td>
                    <td className="text-center">
                      {log.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </td>
                    <td className="text-right" style={{ fontWeight: 'bold' }}>
                      {log.type === 'income' ? '+' : '-'}{log.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: '2rem' }}></div>
        </div>
      </div>
    </div>
  );
}
