import type { SalaryResult } from '../utils/salaryCalculations';
import { Banknote, Users, Gift, Gem } from 'lucide-react';

interface SalarySummaryProps {
  data: SalaryResult[];
}

export default function SalarySummary({ data }: SalarySummaryProps) {
  if (!data) return null;

  const totalIC = data.reduce((sum, item) => sum + item.ic_salary, 0);
  const totalOC = data.reduce((sum, item) => sum + item.oc_money, 0);
  const totalCash = totalIC + totalOC;

  const totalGacha = data.reduce((sum, item) => sum + item.gacha_ic + item.agency_gacha + item.gacha_promote + item.gacha_premium, 0);
  const totalCoins = data.reduce((sum, item) => sum + item.coins, 0);
  const activeStaffCount = data.filter(item => item.total_hours > 0).length;

  return (
    <div className="salary-summary-cards">
      <div className="summary-card">
        <div className="summary-icon purple">
          <Banknote size={24} />
        </div>
        <div className="summary-details">
          <h4>ยอดเงินจ่ายรวม (IC + OC)</h4>
          <p className="summary-value">{totalCash.toLocaleString()}</p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-icon green">
          <Users size={24} />
        </div>
        <div className="summary-details">
          <h4>บุคลากรที่เข้าเวร</h4>
          <p className="summary-value">{activeStaffCount} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/ {data.length} คน</span></p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-icon orange">
          <Gift size={24} />
        </div>
        <div className="summary-details">
          <h4>กาชาที่แจกจ่ายรวม</h4>
          <p className="summary-value">{totalGacha.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>ลูก</span></p>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
          <Gem size={24} />
        </div>
        <div className="summary-details">
          <h4>เหรียญหน่วยงานที่แจกจ่ายรวม</h4>
          <p className="summary-value">{totalCoins.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>เหรียญ</span></p>
        </div>
      </div>
    </div>
  );
}
