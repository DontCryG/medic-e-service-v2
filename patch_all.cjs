const fs = require('fs');

// --- Patch PayslipModal.tsx ---
let payslip = fs.readFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', 'utf-8');

payslip = payslip.replace(
  'const totalIncome = user.ic_salary + user.story_money + user.oc_money + ((user as any).bonus_cash || 0);',
  'const totalIncome = user.ic_salary + user.story_money + (user.mentor_money || 0) + ((user as any).bonus_cash || 0);'
);

payslip = payslip.replace(
  '<span>เงิน OC (อุดหนุน/พิเศษ)</span>\r\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>',
  '<span>เงินพี่เลี้ยงหมอใหม่</span>\r\n            <span>{user.mentor_money > 0 ? user.mentor_money.toLocaleString() : \'-\'}</span>'
);
payslip = payslip.replace(
  '<span>เงิน OC (อุดหนุน/พิเศษ)</span>\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>',
  '<span>เงินพี่เลี้ยงหมอใหม่</span>\n            <span>{user.mentor_money > 0 ? user.mentor_money.toLocaleString() : \'-\'}</span>'
);

payslip = payslip.replace(
  '<div className="payslip-row">\r\n            <span>เหรียญหน่วยงาน (Coins)</span>',
  '<div className="payslip-row">\r\n            <span>เงิน OC (อุดหนุน/พิเศษ)</span>\r\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>\r\n          </div>\r\n          <div className="payslip-row">\r\n            <span>เหรียญหน่วยงาน (Coins)</span>'
);
payslip = payslip.replace(
  '<div className="payslip-row">\n            <span>เหรียญหน่วยงาน (Coins)</span>',
  '<div className="payslip-row">\n            <span>เงิน OC (อุดหนุน/พิเศษ)</span>\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>\n          </div>\n          <div className="payslip-row">\n            <span>เหรียญหน่วยงาน (Coins)</span>'
);

fs.writeFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', payslip);

// --- Patch SalaryTable.tsx ---
let table = fs.readFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', 'utf-8');

table = table.replace(
  'if (row.mentor_money > 0) msg += `เงินพิเศษพี่เลี้ยง: ${row.mentor_money.toLocaleString()}\\n`;',
  'if (row.mentor_money > 0) msg += `เงินพิเศษพี่เลี้ยง: ${row.mentor_money.toLocaleString()}\\n`;\n      const netTotal = row.ic_salary + row.story_money + (row.mentor_money || 0);\n      if (netTotal > 0) msg += `รวมเงิน IC สุทธิ: ${netTotal.toLocaleString()}\\n\\n`;'
);

table = table.replace(
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>',
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>\n              <th style={{ textAlign: \'right\' }}>รวมสุทธิ (IC)</th>'
);

table = table.replace(
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\r\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\r\n                </td>',
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\r\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\r\n                </td>\r\n                <td style={{ textAlign: \'right\', color: \'#10b981\', fontWeight: \'bold\' }}>\r\n                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}\r\n                </td>'
);
table = table.replace(
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\n                </td>',
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\n                </td>\n                <td style={{ textAlign: \'right\', color: \'#10b981\', fontWeight: \'bold\' }}>\n                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}\n                </td>'
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', table);
