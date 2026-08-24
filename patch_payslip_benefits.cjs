const fs = require('fs');
const path = 'src/pages/SalarySystem/components/PayslipModal.tsx';
let lines = fs.readFileSync(path, 'utf-8').split('\n');

const newLines = [
  '          <div className="payslip-row">\r',
  '            <span>เงิน OC (อุดหนุน/พิเศษ)</span>\r',
  '            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>\r',
  '          </div>\r'
];

lines.splice(189, 0, ...newLines);

fs.writeFileSync(path, lines.join('\n'));
