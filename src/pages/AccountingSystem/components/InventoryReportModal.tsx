import React, { useMemo, useEffect } from 'react';
import { useInventoryLogs } from '../hooks/useAccountingQueries';

interface InventoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
}

export default function InventoryReportModal({ isOpen, onClose, startDate, endDate }: InventoryReportModalProps) {
  const { data: inventoryLogs = [] } = useInventoryLogs();

  const filteredLogs = useMemo(() => {
    return inventoryLogs.filter(log => {
      const logDate = new Date(log.created_at);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });
  }, [inventoryLogs, startDate, endDate]);

  const { totalReceived, totalDisbursed } = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      if (log.type === 'receive') acc.totalReceived += log.quantity;
      else acc.totalDisbursed += log.quantity;
      return acc;
    }, { totalReceived: 0, totalDisbursed: 0 });
  }, [filteredLogs]);

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
            <h3 className="text-2xl font-black text-sky-600 mb-2">รายงานสรุปคลังยาและเวชภัณฑ์</h3>
            <p className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
              {(startDate || endDate) 
                ? `วันที่ ${startDate ? new Date(startDate).toLocaleDateString('th-TH') : '-'} - ${endDate ? new Date(endDate).toLocaleDateString('th-TH') : 'ปัจจุบัน'}`
                : `ข้อมูลภาพรวม ณ วันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}`
              }
            </p>
          </div>
        </div>

        {/* Summary Cards (Print friendly) */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-bold text-slate-500 mb-1">รวมรับเข้าทั้งหมด (Received)</p>
            <p className="text-3xl font-black text-emerald-600">{totalReceived.toLocaleString()} <span className="text-base text-slate-500 font-medium">ชิ้น</span></p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-bold text-slate-500 mb-1">รวมเบิกออกทั้งหมด (Disbursed)</p>
            <p className="text-3xl font-black text-amber-600">{totalDisbursed.toLocaleString()} <span className="text-base text-slate-500 font-medium">ชิ้น</span></p>
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
              <th className="py-3 font-bold w-[15%]">วันเวลา</th>
              <th className="py-3 font-bold w-[15%]">ประเภท</th>
              <th className="py-3 font-bold w-[25%]">ชื่อสิ่งของ</th>
              <th className="py-3 font-bold text-right w-[15%] pr-6">จำนวน</th>
              <th className="py-3 font-bold">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-bold border-b border-slate-200">
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
                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'receive' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {log.type === 'receive' ? 'รับเข้า' : 'เบิกออก'}
                    </span>
                  </td>
                  <td className="py-4 align-top font-bold text-slate-700">
                    {log.item_name}
                  </td>
                  <td className={`py-4 align-top text-right pr-6 font-black ${log.type === 'receive' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {log.type === 'receive' ? '+' : '-'}{log.quantity.toLocaleString()}
                  </td>
                  <td className="py-4 align-top font-medium text-slate-600">
                    {log.description || '-'}
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
            <p className="text-sm font-bold text-slate-600 mb-1">ผู้จัดทำรายงาน / ผู้รับผิดชอบคลังยา</p>
            <p className="text-xs text-slate-400">วันที่ ........................................................</p>
          </div>
        </div>

      </div>
    </div>
  );
}
