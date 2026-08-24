import type { SalaryResult } from '../utils/salaryCalculations';
import { Printer, X } from 'lucide-react';

interface PayslipModalProps {
  user: SalaryResult;
  startDate: Date;
  endDate: Date;
  onClose: () => void;
}

export default function PayslipModal({ user, startDate, endDate, onClose }: PayslipModalProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handlePrint = () => {
    window.print();
  };

  const totalIncome = user.ic_salary + user.story_money + (user.mentor_money || 0) + ((user as any).bonus_cash || 0);

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
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
            .modal-overlay {
              background: transparent !important;
            }
            /* A5 size payslip or 2 per page A4 portrait */
            @page { size: portrait; margin: 1cm; }
          }

          .payslip-container {
            width: 100%;
            border: 2px solid #1e293b;
            padding: 2rem;
            border-radius: 8px;
            color: #0f172a;
            font-family: sans-serif;
          }
          
          .payslip-header {
            text-align: center;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
          }

          .payslip-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
            font-size: 1rem;
          }

          .payslip-row.total {
            font-weight: bold;
            font-size: 1.25rem;
            border-top: 2px solid #1e293b;
            border-bottom: 2px double #1e293b;
            padding: 0.75rem 0;
            margin-top: 1rem;
          }

          .payslip-section-title {
            font-weight: bold;
            background: #f1f5f9;
            padding: 0.5rem;
            margin: 1.5rem 0 0.75rem 0;
            border: 1px solid #cbd5e1;
          }
          
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
        `}
      </style>
      
      <div 
        className="print-area" 
        style={{ width: '100%', maxWidth: '800px', padding: '2.5rem', background: '#fff', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', margin: 0 }}>
            <Printer size={24} /> ตัวอย่างก่อนพิมพ์ (สลิปเงินเดือนรายบุคคล)
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handlePrint}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Printer size={18} /> พิมพ์สลิป
            </button>
            <button className="close-btn" onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        {/* Print Document Content */}
        <div className="payslip-container">
          <div className="payslip-header">
            <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>หน่วยงานแพทย์ (Medic Services)</h1>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', fontWeight: 'normal' }}>ใบแจ้งเงินเดือน / สวัสดิการ (Payslip)</h2>
            <p style={{ margin: 0, fontSize: '1rem' }}>ประจำรอบวันที่: {formatDate(startDate)} - {formatDate(endDate)}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <strong>ชื่อ-สกุล (IC):</strong> {user.ic_name}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>ตำแหน่ง:</strong> {user.position_name}
            </div>
            <div>
              <strong>ชั่วโมงเข้าเวร:</strong> {user.total_hours} ชม. ({Math.floor(user.total_minutes / 60)}h {Math.floor(user.total_minutes % 60)}m)
            </div>
          </div>

          <div className="payslip-section-title">รายได้ (Income)</div>
          
          <div className="payslip-row">
            <span>เงินเดือน (IC Salary)</span>
            <span>{user.ic_salary > 0 ? user.ic_salary.toLocaleString() : '-'}</span>
          </div>
          <div className="payslip-row">
            <span>เงินค่าเคสสตอรี่ ({user.story_count} เคส)</span>
            <span>{user.story_money > 0 ? user.story_money.toLocaleString() : '-'}</span>
          </div>
          <div className="payslip-row">
            <span>เงินพี่เลี้ยงหมอใหม่</span>
            <span>{user.mentor_money > 0 ? user.mentor_money.toLocaleString() : '-'}</span>
          </div>
          <div className="payslip-row total">
            <span>รวมรายรับทั้งสิ้น (Total Income)</span>
            <span>฿ {totalIncome.toLocaleString()}</span>
          </div>

          <div className="payslip-section-title">สวัสดิการ (Benefits)</div>
          <div className="payslip-row">
            <span>กาชา IC</span>
            <span>{user.gacha_ic > 0 ? user.gacha_ic : '-'}</span>
          </div>
          <div className="payslip-row">
            <span>กาชา หน่วยงาน</span>
            <span>{user.agency_gacha > 0 ? user.agency_gacha : '-'}</span>
          </div>
          <div className="payslip-row">
            <span>กาชา Premium</span>
            <span>{user.gacha_premium > 0 ? user.gacha_premium : '-'}</span>
          </div>
          <div className="payslip-row">
            <span>กาชา Promote</span>
            <span>{user.gacha_promote > 0 ? user.gacha_promote : '-'}</span>
          </div>
          <div className="payslip-row">
            <span>เงิน OC (อุดหนุน/พิเศษ)</span>
            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : '-'}</span>
          </div>
          <div className="payslip-row">
            <span>เหรียญหน่วยงาน (Coins)</span>
            <span>{user.coins > 0 ? user.coins : '-'}</span>
          </div>


        </div>
      </div>
    </div>
  );
}
