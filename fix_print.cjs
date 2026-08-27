const fs = require('fs');

function fixModal(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix the wrapper class
  content = content.replace(
    /className="fixed inset-0 z-\[-9999\] opacity-0 pointer-events-none print:opacity-100 print:z-\[9999\] print:bg-white print:static print:inset-auto"/g,
    'className="fixed inset-0 z-[-9999] opacity-0 pointer-events-none print:opacity-100 print:z-[9999] print:bg-white print:block"'
  );

  // Inject a much stronger print reset that forces the background to white
  content = content.replace(
    /@media print \{/,
    `@media print {
            html, body { 
              background-color: white !important; 
              height: 100% !important;
            }`
  );

  // Fix the print-area inline style to NOT be a scrollable box
  if (file.includes('SalaryReportModal')) {
    content = content.replace(
      /style=\{\{ width: '100%', background: '#fff', margin: 0, padding: 0 \}\}/g, // The one I just injected
      `style={{ width: '100%', background: '#fff', padding: '20px' }}`
    );
    // Also remove any remaining bad inline styles just in case
    content = content.replace(
      /style=\{\{ width: '100%', maxWidth: '1100px', padding: '1.5cm', background: '#fff', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' \}\}/g,
      `style={{ width: '100%', background: '#fff', padding: '20px' }}`
    );
  } else {
    // PayslipModal
    content = content.replace(
      /style=\{\{ width: '100%', maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '1.5cm' \}\}/g,
      `style={{ width: '100%', background: '#fff', padding: '20px' }}`
    );
  }

  // Ensure print-area takes the full page and clears any parent positioning
  content = content.replace(
    /\.print-area \{[\s\S]*?\}/,
    `.print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background-color: white !important;
              padding: 20px !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              min-height: 100vh !important;
              overflow: visible !important;
            }`
  );

  fs.writeFileSync(file, content, 'utf8');
}

fixModal('src/pages/SalarySystem/components/SalaryReportModal.tsx');
fixModal('src/pages/SalarySystem/components/PayslipModal.tsx');

console.log("Modals print layout fixed.");