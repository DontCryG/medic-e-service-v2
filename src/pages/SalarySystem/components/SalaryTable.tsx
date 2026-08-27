import type { SalaryResult } from '../utils/salaryCalculations';

interface SalaryTableProps {
  data: SalaryResult[];
  onOpenDutyLogModal: (user: any) => void;
  onPrintPayslip: (user: SalaryResult) => void;
}

export default function SalaryTable({ data, onOpenDutyLogModal, onPrintPayslip }: SalaryTableProps) {
  // Use data as passed in (already sorted by calculateSalary)
  const filteredData = data.filter(item => item.total_hours > 0 || item.total_minutes > 0);if (filteredData.length === 0) {
    return (
      <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        ไม่พบข้อมูลบุคลากรที่มีการเข้าเวรในช่วงเวลานี้
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)] overflow-hidden">
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap text-left min-w-[150px]">ชื่อ-สกุล (IC)</th>
              <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap text-center">เวลาเข้าเวร (ชม.)</th>
              <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap text-right">เงิน IC สุทธิ (รวมโบนัส)</th>
              <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap text-right">เงิน OC</th>
              <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap text-center">กาชารวม</th>
              <th className="p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap text-center">เหรียญหน่วยงาน</th>
              <th className="hide-on-print p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-sm whitespace-nowrap text-center w-[120px]">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const netTotal = item.ic_salary + item.story_money + (item.mentor_money || 0);
              const totalGacha = item.gacha_ic + item.agency_gacha + item.gacha_premium + item.gacha_promote;
              
              return (
              <tr key={item.discord_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 align-middle">
                  <div className="font-semibold text-slate-700">{item.ic_name}</div>
                  <div className="text-sm text-slate-500">{item.position_name}</div>
                </td>
                <td className="p-4 align-middle text-center">
                  <div className="font-semibold text-slate-700">{item.total_hours} ชม.</div>
                  <div className="text-xs text-slate-400">
                    ({Math.floor(item.total_minutes / 60)}h {Math.floor(item.total_minutes % 60)}m)
                  </div>
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="font-bold text-green-600 text-[1.1rem]">
                    {netTotal > 0 ? netTotal.toLocaleString() : '-'}
                  </div>
                  {(item.story_money > 0 || item.mentor_money > 0) && (
                    <div className="text-xs text-emerald-500 font-medium mt-0.5">
                      (+โบนัส
                      {item.story_money > 0 && item.mentor_money > 0 ? 'สตอรี่,พี่เลี้ยง' : 
                       item.story_money > 0 ? 'สตอรี่' : 
                       item.mentor_money > 0 ? 'พี่เลี้ยง' : ''})
                    </div>
                  )}
                </td>
                <td className="p-4 align-middle text-right font-bold" style={{ color: item.oc_money > 0 ? '#ea580c' : 'inherit' }}>
                  {item.oc_money > 0 ? item.oc_money.toLocaleString() : '-'}
                </td>
                <td className="p-4 align-middle text-center font-bold" style={{ color: totalGacha > 0 ? '#8b5cf6' : 'inherit' }}>
                  {totalGacha > 0 ? totalGacha : '-'}
                </td>
                <td className="p-4 align-middle text-center font-bold" style={{ color: item.coins > 0 ? '#f59e0b' : 'inherit' }}>
                  {item.coins > 0 ? item.coins : '-'}
                </td>
                <td className="hide-on-print p-4 align-middle">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => onPrintPayslip(item)} className="w-9 h-9 rounded-xl border border-green-200 bg-green-50 text-green-600 flex items-center justify-center cursor-pointer hover:bg-green-100 hover:-translate-y-0.5 transition-all" title="พิมพ์สลิปเงินเดือน">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    </button>
                    <button onClick={() => onOpenDutyLogModal(item)} className="w-9 h-9 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 hover:-translate-y-0.5 transition-all" title="ประวัติการเข้าเวร">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </button>
                    
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
