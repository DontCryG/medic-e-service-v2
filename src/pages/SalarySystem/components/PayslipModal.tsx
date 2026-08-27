import type { SalaryResult } from '../utils/salaryCalculations';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  useEffect(() => {
    const originalTitle = document.title;
    const formattedName = user.ic_name.replace(/\s+/g, '_');
    
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear();
    document.title = `${formattedName}-${d}-${m}-${y}`;

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
  }, [user.ic_name, startDate, onClose]);

  const totalIncome = user.ic_salary + user.story_money + (user.mentor_money || 0) + ((user as any).bonus_cash || 0);

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
            .print-color-exact {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page { size: portrait; margin: 0; }
          }
        `}
      </style>
      
      <div 
        className="print-area print-color-exact" 
        style={{ width: '100%', background: '#fff', padding: '20px' }}
      >
        <div className="w-full">
          <div className="flex flex-col items-center justify-center pb-6 mb-8 border-b-2 border-slate-100">
            <img src="/logo.png" alt="Hospital Logo" className="w-20 h-20 object-contain mb-4" />
            <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">หน่วยงานแพทย์ (Medic Services)</h1>
            <h2 className="text-lg font-medium text-slate-500 mb-2">ใบแจ้งเงินเดือน / สวัสดิการ (Payslip)</h2>
            <p className="text-sm text-slate-400">ประจำรอบวันที่: {formatDate(startDate)} - {formatDate(endDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ชื่อ-สกุล (IC)</span>
              <span className="text-base font-medium text-slate-800">{user.ic_name}</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ตำแหน่ง</span>
              <span className="text-base font-medium text-slate-800">{user.position_name}</span>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ชั่วโมงเข้าเวร</span>
              <span className="text-base font-medium text-slate-800">{user.total_hours} ชม. <span className="text-slate-500 text-sm font-normal">({Math.floor(user.total_minutes / 60)}h {Math.floor(user.total_minutes % 60)}m)</span></span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-bold text-slate-800 uppercase tracking-wider bg-slate-50 py-2.5 px-5 rounded-xl mb-4 border border-slate-100">รายได้ (Income)</div>
            <div className="px-5">
              <div className="flex justify-between py-2.5 text-slate-600 border-b border-slate-100">
                <span>เงินเดือน (IC Salary)</span>
                <span className="font-medium text-slate-800">{user.ic_salary > 0 ? user.ic_salary.toLocaleString() : '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-slate-600 border-b border-slate-100">
                <span>เงินค่าเคสสตอรี่ ({user.story_count} เคส)</span>
                <span className="font-medium text-slate-800">{user.story_money > 0 ? user.story_money.toLocaleString() : '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-slate-600">
                <span>เงินพี่เลี้ยงหมอใหม่</span>
                <span className="font-medium text-slate-800">{user.mentor_money > 0 ? user.mentor_money.toLocaleString() : '-'}</span>
              </div>
              <div className="flex justify-between py-4 mt-2 border-t-2 border-slate-100 text-lg font-bold text-[var(--primary)]">
                <span>รวมรายรับทั้งสิ้น (Total Income)</span>
                <span>฿ {totalIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-800 uppercase tracking-wider bg-slate-50 py-2.5 px-5 rounded-xl mb-4 border border-slate-100">สวัสดิการ (Benefits)</div>
            <div className="px-5">
              <div className="flex justify-between py-2.5 text-slate-600 border-b border-slate-100">
                <span>กาชา IC</span>
                <span className="font-medium text-slate-800">{user.gacha_ic > 0 ? user.gacha_ic : '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-slate-600 border-b border-slate-100">
                <span>กาชา หน่วยงาน</span>
                <span className="font-medium text-slate-800">{user.agency_gacha > 0 ? user.agency_gacha : '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-slate-600 border-b border-slate-100">
                <span>กาชา Premium</span>
                <span className="font-medium text-slate-800">{user.gacha_premium > 0 ? user.gacha_premium : '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-slate-600 border-b border-slate-100">
                <span>กาชา Promote</span>
                <span className="font-medium text-slate-800">{user.gacha_promote > 0 ? user.gacha_promote : '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-slate-600 border-b border-slate-100">
                <span>เงิน OC (อุดหนุน/พิเศษ)</span>
                <span className="font-medium text-slate-800">{user.oc_money > 0 ? user.oc_money.toLocaleString() : '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-slate-600">
                <span>เหรียญหน่วยงาน (Coins)</span>
                <span className="font-medium text-slate-800">{user.coins > 0 ? user.coins : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);

  return createPortal(modalContent, document.body);
}
