const fs = require('fs');

function fixSyntax(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\);\r?\n\}\r?\n?$/, ');\n\n  return createPortal(modalContent, document.body);\n}\n');
  fs.writeFileSync(file, content, 'utf8');
}

fixSyntax('src/pages/SalarySystem/components/SalaryReportModal.tsx');
fixSyntax('src/pages/SalarySystem/components/PayslipModal.tsx');

console.log("Fixed portal syntax with CRLF");