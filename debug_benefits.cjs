const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', 'utf-8');
const benefitMatch = code.match(/<div className="payslip-section-title">สวัสดิการ.*?<\/div>[\s\S]*?<\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>/);
console.log(benefitMatch ? benefitMatch[0] : 'Not found');
