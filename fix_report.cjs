const fs = require('fs');

let report = fs.readFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', 'utf8');

// Replace the wrapper div
report = report.replace(
  /<div className="fixed inset-0 z-\[-9999\] opacity-0 pointer-events-none print:opacity-100 print:z-\[9999\] print:bg-white print:static print:inset-auto">/g,
  '<div className="fixed inset-0 z-[-9999] opacity-0 pointer-events-none print:opacity-100 print:z-[9999] print:bg-white print:block">'
);

// Add html, body background to print styles
report = report.replace(
  /body \* \{[\s\S]*?visibility: hidden;\n\s*\}/,
  `html, body { background: white !important; }
            body * {
              visibility: hidden;
            }`
);

// Replace inline styles of print-area
report = report.replace(
  /style=\{\{ width: '100%', maxWidth: '1100px', padding: '1.5cm', background: '#fff', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' \}\}/g,
  `style={{ width: '100%', background: '#fff', margin: 0, padding: 0 }}`
);

// Remove the absolute positioning from print-area in CSS to let it flow naturally
report = report.replace(
  /\.print-area \{\s*position: absolute !important;\s*left: 0 !important;\s*top: 0 !important;/g,
  `.print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              background: white !important;`
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', report, 'utf8');
console.log("Updated SalaryReportModal");