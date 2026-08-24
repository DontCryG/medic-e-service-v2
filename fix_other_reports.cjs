const fs = require('fs');

const files = [
  'src/pages/AccountingSystem/components/FinanceReportModal.tsx',
  'src/pages/AccountingSystem/components/InventoryReportModal.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Normalize line endings to help matching
  code = code.replace(/\r\n/g, '\n');
  
  code = code.replace(
    '.report-table {\n            width: 100%;\n            border-collapse: collapse;\n            margin-bottom: 2rem;\n            font-size: 0.85rem;\n          }',
    '.report-table {\n            width: 100%;\n            border-collapse: collapse;\n            margin-bottom: 2rem;\n            font-size: 0.85rem;\n            table-layout: fixed;\n            word-break: break-word;\n          }'
  );
  
  fs.writeFileSync(file, code);
}
console.log('Fixed CSS in both files');
