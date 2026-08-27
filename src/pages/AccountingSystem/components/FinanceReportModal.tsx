import React, { useMemo, useEffect } from 'react';
import { useFinanceLogs } from '../hooks/useAccountingQueries';

interface FinanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
}

export default function FinanceReportModal({ isOpen, onClose, startDate, endDate }: FinanceReportModalProps) {
  const { data: financeLogs = [] } = useFinanceLogs();

  const filteredLogs = useMemo(() => {
    return financeLogs.filter(log => {
      const logDate = new Date(log.created_at);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });
  }, [financeLogs, startDate, endDate]);

  const { totalIncome, totalExpense } = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      if (log.type === 'income') acc.totalIncome += log.amount;
      else acc.totalExpense += log.amount;
      return acc;
    }, { totalIncome: 0, totalExpense: 0, periodBalance: 0 });
  }, [filteredLogs]);

  const finalBalance = totalIncome - totalExpense;

  useEffect(() => {
    if (isOpen) {
      const handleAfterPrint = () => {
        onClose();
      };
      
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        window.print();
        setTimeout(() => onClose(), 1000);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-[9999] text-slate-800 font-sans" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      <div className="max-w-[210mm] mx-auto p-10 print:p-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-end border-b-2 border-slate-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Medic Services</h1>
            <h2 className="text-xl font-bold text-slate-500">สำนักงานแพทย์ WIP TOWN</h2>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-black text-blue-600 mb-2">รายงานสรุปบัญชีการเงิน</h3>
            <p className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
              {(startDate || endDate) 
                ? `วันที่ ${startDate ? new Date(startDate).toLocaleDateString('th-TH') : '-'} - ${endDate ? new Date(endDate).toLocaleDateString('th-TH') : 'ปัจจุบัน'}`
                : `ข้อมูลภาพรวม ณ วันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}`
              }
            </p>
          </div>
        </div>

        {/* Summary Cards (Print friendly) */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-500 mb-1">รายรับรวม (Income)</p>
            <p className="text-2xl font-black text-emerald-600">฿ {totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-500 mb-1">รายจ่ายรวม (Expense)</p>
            <p className="text-2xl font-black text-rose-600">฿ {totalExpense.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-sm font-bold text-blue-600 mb-1">ยอดสุทธิ (Net Balance)</p>
            <p className="text-2xl font-black text-blue-700">฿ {finalBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* Table Section */}
        <div className="mb-4">
          <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            รายการความเคลื่อนไหว
            <div className="h-px bg-slate-200 flex-1 ml-4"></div>
          </h4>
        </div>

        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-800">
              <th className="py-3 font-bold w-[20%]">วันเวลา</th>
              <th className="py-3 font-bold w-[15%]">ประเภท</th>
              <th className="py-3 font-bold">รายละเอียด</th>
              <th className="py-3 font-bold w-[20%] text-right">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-bold border-b border-slate-200">
                  ไม่มีรายการเคลื่อนไหวในช่วงเวลาที่กำหนด
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={log.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="py-4 align-top">
                    <div className="font-bold text-slate-700">{new Date(log.created_at).toLocaleDateString('th-TH')}</div>
                    <div className="text-xs text-slate-500">{new Date(log.created_at).toLocaleTimeString('th-TH')}</div>
                  </td>
                  <td className="py-4 align-top">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {log.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </td>
                  <td className="py-4 align-top font-medium text-slate-600">
                    {log.description || '-'}
                  </td>
                  <td className={`py-4 align-top text-right font-black ${log.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {log.type === 'income' ? '+' : '-'}{log.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer / Signatures */}
        <div className="mt-20 pt-8 border-t border-slate-200 flex justify-end">
          <div className="text-center w-64">
            <div className="border-b border-slate-400 border-dashed h-8 mb-2"></div>
            <p className="text-sm font-bold text-slate-600 mb-1">ผู้จัดทำรายงาน / ผู้ตรวจสอบ</p>
            <p className="text-xs text-slate-400">วันที่ ........................................................</p>
          </div>
        </div>

      </div>
    </div>
  );
}
