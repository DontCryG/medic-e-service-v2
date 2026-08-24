const fs = require('fs');
const path = 'src/pages/SalarySystem/components/PayslipModal.tsx';
let lines = fs.readFileSync(path, 'utf-8').split('\n');

lines[163] = '            <span>เงินพี่เลี้ยงหมอใหม่</span>\r';
lines[164] = '            <span>{user.mentor_money > 0 ? user.mentor_money.toLocaleString() : \'-\'}</span>\r';

fs.writeFileSync(path, lines.join('\n'));
