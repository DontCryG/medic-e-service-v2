const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', 'utf-8');

code = code.replace(
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>',
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>\n              <th style={{ textAlign: \'right\' }}>รวมสุทธิ (IC)</th>'
);

code = code.replace(
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\n                </td>',
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\n                </td>\n                <td style={{ textAlign: \'right\', color: \'#10b981\', fontWeight: \'bold\' }}>\n                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}\n                </td>'
);

// Fallback for CRLF
code = code.replace(
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>\r\n              <th style={{ textAlign: \'right\' }}>เงิน OC</th>',
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>\r\n              <th style={{ textAlign: \'right\' }}>รวมสุทธิ (IC)</th>\r\n              <th style={{ textAlign: \'right\' }}>เงิน OC</th>'
);

code = code.replace(
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\r\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\r\n                </td>\r\n                <td style={{ textAlign: \'right\', color: item.oc_money > 0 ? \'#ea580c\' : \'inherit\', fontWeight: \'bold\' }}>',
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\r\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\r\n                </td>\r\n                <td style={{ textAlign: \'right\', color: \'#10b981\', fontWeight: \'bold\' }}>\r\n                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}\r\n                </td>\r\n                <td style={{ textAlign: \'right\', color: item.oc_money > 0 ? \'#ea580c\' : \'inherit\', fontWeight: \'bold\' }}>'
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', code);
