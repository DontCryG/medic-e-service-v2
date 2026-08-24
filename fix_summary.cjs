const fs = require('fs');
const path = 'src/pages/SalarySystem/components/SalarySummary.tsx';
let code = fs.readFileSync(path, 'utf-8');

code = code.replace(
  'const totalIC = data.reduce((sum, item) => sum + item.ic_salary, 0);',
  'const totalCash = data.reduce((sum, item) => sum + item.ic_salary + item.story_money + (item.mentor_money || 0), 0);'
);
code = code.replace('const totalOC = data.reduce((sum, item) => sum + item.oc_money, 0);\r\n', '');
code = code.replace('const totalCash = totalIC + totalOC;\r\n', '');
code = code.replace('const totalOC = data.reduce((sum, item) => sum + item.oc_money, 0);\n', '');
code = code.replace('const totalCash = totalIC + totalOC;\n', '');

code = code.replace('ยอดเงินจ่ายรวม (IC + OC)', 'ยอดเงินจ่ายรวม (IC สุทธิ)');

fs.writeFileSync(path, code);
