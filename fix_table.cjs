const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', 'utf-8');

// Discord format update
code = code.replace(
  'if (row.mentor_money > 0) msg += \เงินพิเศษพี่เลี้ยง: \\\n\;',
  'if (row.mentor_money > 0) msg += \เงินพิเศษพี่เลี้ยง: \\\n\;\n    const netTotal = row.ic_salary + row.story_money + (row.mentor_money || 0);\n    msg += \รวมเงิน IC สุทธิ: \\\n\\n\;'
);

// Add table header
code = code.replace(
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>',
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>\n              <th style={{ textAlign: \'right\' }}>รวมสุทธิ (IC)</th>'
);

// Add table cell
code = code.replace(
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\n                </td>',
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\n                </td>\n                <td style={{ textAlign: \'right\', color: \'#10b981\', fontWeight: \'bold\' }}>\n                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}\n                </td>'
);

code = code.replace(
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\r\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\r\n                </td>',
  '<td style={{ textAlign: \'right\', color: item.mentor_money > 0 ? \'#3b82f6\' : \'inherit\', fontWeight: \'bold\' }}>\r\n                  {item.mentor_money > 0 ? item.mentor_money.toLocaleString() : \'-\'}\r\n                </td>\r\n                <td style={{ textAlign: \'right\', color: \'#10b981\', fontWeight: \'bold\' }}>\r\n                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}\r\n                </td>'
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', code);
