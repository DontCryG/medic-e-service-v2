const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', 'utf-8');

code = code.replace(
  '<span>เงิน OC (อุดหนุน/พิเศษ)</span>\r\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>',
  '<span>เงินพี่เลี้ยงหมอใหม่</span>\r\n            <span>{user.mentor_money > 0 ? user.mentor_money.toLocaleString() : \'-\'}</span>'
);

code = code.replace(
  '<span>เงิน OC (อุดหนุน/พิเศษ)</span>\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>',
  '<span>เงินพี่เลี้ยงหมอใหม่</span>\n            <span>{user.mentor_money > 0 ? user.mentor_money.toLocaleString() : \'-\'}</span>'
);


code = code.replace(
  '<div className="payslip-row">\r\n            <span>เหรียญหน่วยงาน (Coins)</span>',
  '<div className="payslip-row">\r\n            <span>เงิน OC (อุดหนุน/พิเศษ)</span>\r\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>\r\n          </div>\r\n          <div className="payslip-row">\r\n            <span>เหรียญหน่วยงาน (Coins)</span>'
);

code = code.replace(
  '<div className="payslip-row">\n            <span>เหรียญหน่วยงาน (Coins)</span>',
  '<div className="payslip-row">\n            <span>เงิน OC (อุดหนุน/พิเศษ)</span>\n            <span>{user.oc_money > 0 ? user.oc_money.toLocaleString() : \'-\'}</span>\n          </div>\n          <div className="payslip-row">\n            <span>เหรียญหน่วยงาน (Coins)</span>'
);

fs.writeFileSync('src/pages/SalarySystem/components/PayslipModal.tsx', code);
