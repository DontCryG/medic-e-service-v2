const fs = require('fs');

function fixModal(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Change absolute to static for print-area to allow pagination
  content = content.replace(
    /\.print-area \{\s*position: absolute !important;/g,
    `.print-area {
              position: static !important;`
  );
  
  // Remove min-height: 100vh just in case it messes with pagination
  content = content.replace(
    /min-height: 100vh !important;/g,
    ''
  );

  fs.writeFileSync(file, content, 'utf8');
}

fixModal('src/pages/SalarySystem/components/SalaryReportModal.tsx');
fixModal('src/pages/SalarySystem/components/PayslipModal.tsx');

console.log("Fixed absolute positioning on print-area.");