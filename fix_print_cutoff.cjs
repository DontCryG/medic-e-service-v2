const fs = require('fs');

function fixModal(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix the wrapper class to make it static and remove inset during print
  content = content.replace(
    /className="fixed inset-0 z-\[-9999\] opacity-0 pointer-events-none print:opacity-100 print:z-\[9999\] print:bg-white print:block"/g,
    'className="fixed inset-0 z-[-9999] opacity-0 pointer-events-none print:opacity-100 print:z-[9999] print:bg-white print:static print:inset-auto print:block"'
  );
  
  // If the old one is there, fix it too just in case
  content = content.replace(
    /className="fixed inset-0 z-\[-9999\] opacity-0 pointer-events-none print:opacity-100 print:z-\[9999\] print:bg-white print:static print:inset-auto"/g,
    'className="fixed inset-0 z-[-9999] opacity-0 pointer-events-none print:opacity-100 print:z-[9999] print:bg-white print:static print:inset-auto print:block"'
  );

  // Inject a much stronger print reset that forces the background to white AND removes all overflow/height restrictions globally
  content = content.replace(
    /@media print \{[\s\S]*?body \* \{/,
    `@media print {
            html, body, #root, [class*="overflow-hidden"], [class*="h-screen"], [class*="fixed"], [class*="absolute"] { 
              background-color: white !important; 
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              position: static !important;
            }
            body * {`
  );

  fs.writeFileSync(file, content, 'utf8');
}

fixModal('src/pages/SalarySystem/components/SalaryReportModal.tsx');
fixModal('src/pages/SalarySystem/components/PayslipModal.tsx');

console.log("Modals pagination and cutoff fixed.");