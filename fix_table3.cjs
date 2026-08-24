const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', 'utf-8');

code = code.replace(
  /if \(row\.mentor_money > 0\) msg \+= `.*?mentor_money.*?`;/,
  `$&
    const netTotal = row.ic_salary + row.story_money + (row.mentor_money || 0);
    if (netTotal > 0) msg += \`รวมเงิน IC สุทธิ: \${netTotal.toLocaleString()}\\n\\n\`;`
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', code);
