const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', 'utf-8');
const incomeMatch = code.match(/<div className="payslip-section-title">รายได้.*?<\/div>[\s\S]*?<div className="payslip-section-title">สวัสดิการ/);
console.log(incomeMatch ? incomeMatch[0] : 'Not found');
