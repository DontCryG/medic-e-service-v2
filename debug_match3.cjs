const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', 'utf-8');
console.log('Has Mentor:', code.includes('เงินพี่เลี้ยงหมอใหม่'));
console.log('Has Total Income with Mentor:', code.includes('user.mentor_money'));
