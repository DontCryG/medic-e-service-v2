const fs = require('fs');
const path = 'src/pages/SalarySystem/components/SalaryTable.tsx';
let lines = fs.readFileSync(path, 'utf-8').split('\n');

// Discord logic at line 21
const newDiscord = [
  '    const netTotal = row.ic_salary + row.story_money + (row.mentor_money || 0);\r',
  '    if (netTotal > 0) msg += \รวมเงิน IC สุทธิ: \\\n\\n\;\r'
];
lines.splice(21, 0, ...newDiscord);

// The td for mentor money is originally at 85-87, but because we inserted 2 lines above, it is now at 87-89
const newTd = [
  '                <td style={{ textAlign: \'right\', color: \'#10b981\', fontWeight: \'bold\' }}>\r',
  '                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}\r',
  '                </td>\r'
];
lines.splice(89, 0, ...newTd);

fs.writeFileSync(path, lines.join('\n'));
