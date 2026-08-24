const fs = require('fs');
const path = 'src/pages/SalarySystem/components/SalaryTable.tsx';
let lines = fs.readFileSync(path, 'utf-8').split('\n');

const newTh = [
  '              <th style={{ textAlign: \'right\' }}>รวมสุทธิ (IC)</th>\r'
];

lines.splice(52, 0, ...newTh);

fs.writeFileSync(path, lines.join('\n'));
