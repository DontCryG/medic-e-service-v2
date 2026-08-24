const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', 'utf-8');

// Fix the syntax error at line 23
code = code.replace(
  /if \(netTotal > 0\) msg \+= .*?;\r?\n/,
  'if (netTotal > 0) msg += `รวมเงิน IC สุทธิ: ${netTotal.toLocaleString()}\\n\\n`;\n'
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryTable.tsx', code);
