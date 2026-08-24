const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', 'utf-8');
const match = code.match(/<div className="payslip-row">\s*<span>เงิน OC[\s\S]*?<\/div>/);
console.log(JSON.stringify(match[0]));
