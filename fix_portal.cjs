const fs = require('fs');

function usePortal(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add react-dom import if not present
  if (!content.includes("import { createPortal } from 'react-dom';")) {
    content = content.replace(
      /import \{ useEffect \} from 'react';/,
      "import { useEffect } from 'react';\nimport { createPortal } from 'react-dom';"
    );
  }

  // Change the return statement to use createPortal
  content = content.replace(
    /return \(\s*<div className="fixed inset-0/m,
    `const modalContent = (
    <div className="fixed inset-0`
  );

  // Replace the final ); with the portal
  content = content.replace(
    /\);\n\}/m,
    `);\n\n  return createPortal(modalContent, document.body);\n}`
  );

  // Update the print CSS to hide #root completely!
  content = content.replace(
    /html, body, #root, \[class\*="overflow-hidden"\], \[class\*="h-screen"\], \[class\*="fixed"\], \[class\*="absolute"\] \{[\s\S]*?body \* \{[\s\S]*?visibility: hidden;\s*\}/,
    `html, body {
              background-color: white !important;
              height: auto !important;
              min-height: 0 !important;
            }
            #root {
              display: none !important;
            }`
  );

  fs.writeFileSync(file, content, 'utf8');
}

usePortal('src/pages/SalarySystem/components/SalaryReportModal.tsx');
usePortal('src/pages/SalarySystem/components/PayslipModal.tsx');

console.log("Portals implemented for print modals.");