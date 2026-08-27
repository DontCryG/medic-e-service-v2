const fs = require('fs');

function fixSyntax(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // If the file ends with ");\n}" and missing portal return
  if (content.includes('const modalContent = (') && !content.includes('createPortal')) {
    content = content.replace(/\);\n\}\s*$/, ');\n\n  return createPortal(modalContent, document.body);\n}\n');
  } else if (content.includes('const modalContent = (') && !content.includes('return createPortal')) {
    // maybe it ends differently
    content = content.replace(/\);\n\}\s*$/, ');\n\n  return createPortal(modalContent, document.body);\n}\n');
  }

  fs.writeFileSync(file, content, 'utf8');
}

fixSyntax('src/pages/SalarySystem/components/SalaryReportModal.tsx');
fixSyntax('src/pages/SalarySystem/components/PayslipModal.tsx');

console.log("Fixed portal syntax");