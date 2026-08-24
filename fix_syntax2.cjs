const fs = require('fs');
let lines = fs.readFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', 'utf-8').split('\n');
lines[22] = '    if (netTotal > 0) msg += \รวมเงิน IC สุทธิ: \\\n\\n\;\r';
lines[23] = '';
fs.writeFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', lines.join('\n'));
