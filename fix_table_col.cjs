const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', 'utf-8');

code = code.replace(
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>',
  '<th style={{ textAlign: \'right\' }}>เงินพี่เลี้ยง</th>\n              <th style={{ textAlign: \'right\' }}>รวมสุทธิ (IC)</th>'
);

code = code.replace(
  /<td style={{ textAlign: 'right', color: item.mentor_money > 0 \? '#3b82f6' : 'inherit', fontWeight: 'bold' }}>\s*\{item.mentor_money > 0 \? item.mentor_money.toLocaleString\(\) : '-'\}\s*<\/td>/g,
  `$&
                <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                  {(item.ic_salary + item.story_money + (item.mentor_money || 0)).toLocaleString()}
                </td>`
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', code);
