import type { SalaryResult } from '../utils/salaryCalculations';
import { Copy, Clock, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

interface SalaryTableProps {
  data: SalaryResult[];
  onOpenDutyLogModal: (user: any) => void;
  onPrintPayslip: (user: SalaryResult) => void;
}

export default function SalaryTable({ data, onOpenDutyLogModal, onPrintPayslip }: SalaryTableProps) {
  // Use data as passed in (already sorted by calculateSalary)
  const filteredData = data.filter(item => item.total_hours > 0 || item.total_minutes > 0);

  const handleCopyDiscordFormat = (row: SalaryResult) => {
    let msg = `ชื่อ (IC): ${row.ic_name}\n`;
    msg += `เวลาเข้าเวร: ${row.total_hours} ชม. (${Math.floor(row.total_minutes / 60)}h ${Math.floor(row.total_minutes % 60)}m)\n`;
    if (row.ic_salary > 0) msg += `เงิน IC: ${row.ic_salary.toLocaleString()}\n`;
    if (row.story_count > 0) msg += `สตอรี่: ${row.story_count} รอบ\n`;
    if (row.story_money > 0) msg += `เงินสตอรี่: ${row.story_money.toLocaleString()}\n`;
    if (row.mentor_money > 0) msg += `เงินพิเศษพี่เลี้ยง: ${row.mentor_money.toLocaleString()}\n`;
    if (row.oc_money > 0) msg += `เงิน OC: ${row.oc_money.toLocaleString()}\n`;
    if (row.gacha_ic > 0) msg += `กาชา IC: ${row.gacha_ic}\n`;
    if (row.agency_gacha > 0) msg += `กาชาหน่วยงาน: ${row.agency_gacha}\n`;
    if (row.gacha_premium > 0) msg += `กาชา Premium: ${row.gacha_premium}\n`;
    if (row.gacha_promote > 0) msg += `กาชา Promote: ${row.gacha_promote}\n`;
    if (row.coins > 0) msg += `เหรียญหน่วยงาน: ${row.coins}`;

    navigator.clipboard.writeText(msg);
    toast.success('คัดลอกข้อความสำหรับ Discord แล้ว');
  };

  if (filteredData.length === 0) {
    return (
      <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        ไม่พบข้อมูลบุคลากรที่มีการเข้าเวรในช่วงเวลานี้
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="salary-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '150px', textAlign: 'left' }}>ชื่อ-สกุล (IC)</th>
              <th style={{ textAlign: 'center' }}>เวลาเข้าเวร (ชม.)</th>
              <th style={{ textAlign: 'right' }}>เงิน IC</th>
              <th style={{ textAlign: 'center' }}>สตอรี่ (เคส)</th>
              <th style={{ textAlign: 'right' }}>เงินสตอรี่</th>
              <th style={{ textAlign: 'right' }}>เงินพี่เลี้ยง</th>
              <th style={{ textAlign: 'right' }}>เงิน OC</th>
              <th style={{ textAlign: 'center' }}>กาชา IC</th>
              <th style={{ textAlign: 'center' }}>กาชาหน่วยงาน</th>
              <th style={{ textAlign: 'center' }}>กาชา Premium</th>
              <th style={{ textAlign: 'center' }}>กาชา Promote</th>
              <th style={{ textAlign: 'center' }}>เหรียญหน่วยงาน</th>
              <th className="hide-on-print" style={{ width: '120px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.discord_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 0' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.ic_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{item.position_name}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{item.total_hours} ชม.</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    ({Math.floor(item.total_minutes / 60)}h {Math.floor(item.total_minutes % 60)}m)
                  </div>
                </td>
                <td style={{ textAlign: 'right' }} className="amount-text">
                  {item.ic_salary > 0 ? item.ic_salary.toLocaleString() : '-'}
                </td>
                <td style={{ textAlign: 'center', color: item.story_count > 0 ? '#10b981' : 'inherit' }}>
                  {item.story_count > 0 ? item.story_count : '-'}
                </td>
                <td style={{ textAlign: 'right', color: item.story_money > 0 ? '#10b981' : 'inherit', fontWeight: 'bold' }}>
                  {item.story_money > 0 ? item.story_money.toLocaleString() : '-'}
                </td>
                <td style={{ textAlign: 'right', color: item.mentor_money > 0 ? '#3b82f6' : 'inherit', fontWeight: 'bold' }}>
                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : '-'}
                </td>
                <td style={{ textAlign: 'right', color: item.oc_money > 0 ? '#ea580c' : 'inherit', fontWeight: 'bold' }}>
                  {item.oc_money > 0 ? item.oc_money.toLocaleString() : '-'}
                </td>
                <td style={{ textAlign: 'center', color: item.gacha_ic > 0 ? '#8b5cf6' : 'inherit' }}>
                  {item.gacha_ic > 0 ? item.gacha_ic : '-'}
                </td>
                <td style={{ textAlign: 'center', color: item.agency_gacha > 0 ? '#0ea5e9' : 'inherit' }}>
                  {item.agency_gacha > 0 ? item.agency_gacha : '-'}
                </td>
                <td style={{ textAlign: 'center', color: item.gacha_premium > 0 ? '#f43f5e' : 'inherit', fontWeight: 'bold' }}>
                  {item.gacha_premium > 0 ? item.gacha_premium : '-'}
                </td>
                <td style={{ textAlign: 'center', color: item.gacha_promote > 0 ? '#ec4899' : 'inherit' }}>
                  {item.gacha_promote > 0 ? item.gacha_promote : '-'}
                </td>
                <td style={{ textAlign: 'center', color: item.coins > 0 ? '#f59e0b' : 'inherit' }}>
                  {item.coins > 0 ? item.coins : '-'}
                </td>
                <td className="hide-on-print" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => onPrintPayslip(item)}
                      style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', color: '#16a34a',
                        transition: 'all 0.2s'
                      }}
                      title="พิมพ์สลิปเงินเดือน"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      onClick={() => onOpenDutyLogModal(item)}
                      style={{
                        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', color: '#3b82f6',
                        transition: 'all 0.2s'
                      }}
                      title="ประวัติการเข้าเวร (แก้ไข/ลบ)"
                    >
                      <Clock size={16} />
                    </button>
                    <button 
                      onClick={() => handleCopyDiscordFormat(item)}
                      style={{
                        background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}
                      title="คัดลอกรูปแบบ Discord"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
