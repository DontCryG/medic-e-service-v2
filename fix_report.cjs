const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', 'utf-8');

const newTable = `          <table className="report-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: '15%' }}>ชื่อ-สกุล (IC)</th>
                <th rowSpan={2} style={{ width: '10%' }}>เวลาเข้าเวร</th>
                <th colSpan={4}>รายได้ (Income)</th>
                <th colSpan={6}>สวัสดิการ (Benefits)</th>
              </tr>
              <tr>
                <th style={{ width: '8%' }}>เงิน IC</th>
                <th style={{ width: '5%' }}>สตอรี่</th>
                <th style={{ width: '8%' }}>เงินสตอรี่</th>
                <th style={{ width: '8%' }}>เงินพี่เลี้ยง</th>
                <th style={{ width: '5%' }}>กาชา IC</th>
                <th style={{ width: '5%' }}>หน่วยงาน</th>
                <th style={{ width: '5%' }}>Prem.</th>
                <th style={{ width: '5%' }}>Promo.</th>
                <th style={{ width: '8%' }}>เงิน OC</th>
                <th style={{ width: '5%' }}>เหรียญ</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{item.ic_name}</div>
                    <div style={{ fontSize: '0.75rem' }}>{item.position_name}</div>
                  </td>
                  <td className="text-center">{item.total_hours} ชม.<br/><span style={{ fontSize: '0.75rem' }}>({Math.floor(item.total_minutes / 60)}h {Math.floor(item.total_minutes % 60)}m)</span></td>
                  <td className="text-right">{item.ic_salary > 0 ? item.ic_salary.toLocaleString() : '-'}</td>
                  <td className="text-center">{item.story_count > 0 ? item.story_count : '-'}</td>
                  <td className="text-right">{item.story_money > 0 ? item.story_money.toLocaleString() : '-'}</td>
                  <td className="text-right">{item.mentor_money > 0 ? item.mentor_money.toLocaleString() : '-'}</td>
                  <td className="text-center">{item.gacha_ic > 0 ? item.gacha_ic : '-'}</td>
                  <td className="text-center">{item.agency_gacha > 0 ? item.agency_gacha : '-'}</td>
                  <td className="text-center">{item.gacha_premium > 0 ? item.gacha_premium : '-'}</td>
                  <td className="text-center">{item.gacha_promote > 0 ? item.gacha_promote : '-'}</td>
                  <td className="text-right">{item.oc_money > 0 ? item.oc_money.toLocaleString() : '-'}</td>
                  <td className="text-center">{item.coins > 0 ? item.coins : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2} className="text-right">รวมทั้งสิ้น</th>
                <th className="text-right">{sortedData.reduce((acc, curr) => acc + curr.ic_salary, 0).toLocaleString()}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.story_count, 0)}</th>
                <th className="text-right">{sortedData.reduce((acc, curr) => acc + curr.story_money, 0).toLocaleString()}</th>
                <th className="text-right">{sortedData.reduce((acc, curr) => acc + (curr.mentor_money || 0), 0).toLocaleString()}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.gacha_ic, 0)}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.agency_gacha, 0)}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.gacha_premium, 0)}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.gacha_promote, 0)}</th>
                <th className="text-right">{sortedData.reduce((acc, curr) => acc + curr.oc_money, 0).toLocaleString()}</th>
                <th className="text-center">{sortedData.reduce((acc, curr) => acc + curr.coins, 0)}</th>
              </tr>
            </tfoot>
          </table>`;

code = code.replace(/<table className="report-table">[\s\S]*?<\/table>/, newTable);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', code);
