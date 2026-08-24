const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', 'utf-8');

// Update CSS
code = code.replace(
  '.report-table {\n            width: 100%;\n            border-collapse: collapse;\n            margin-bottom: 2rem;\n            font-size: 0.85rem;\n          }',
  '.report-table {\n            width: 100%;\n            border-collapse: collapse;\n            margin-bottom: 2rem;\n            font-size: 0.85rem;\n            table-layout: fixed;\n            word-break: break-word;\n          }'
);

// Fallback if \n replacement fails due to \r\n
code = code.replace(
  '.report-table {\r\n            width: 100%;\r\n            border-collapse: collapse;\r\n            margin-bottom: 2rem;\r\n            font-size: 0.85rem;\r\n          }',
  '.report-table {\r\n            width: 100%;\r\n            border-collapse: collapse;\r\n            margin-bottom: 2rem;\r\n            font-size: 0.85rem;\r\n            table-layout: fixed;\r\n            word-break: break-word;\r\n          }'
);

// Add width percentages that sum to 100%
code = code.replace(
  '<th style={{ width: \'8%\' }}>เงิน IC</th>',
  '<th style={{ width: \'9%\' }}>เงิน IC</th>'
);
code = code.replace(
  '<th style={{ width: \'5%\' }}>สตอรี่</th>',
  '<th style={{ width: \'5%\' }}>สตอรี่</th>'
);
code = code.replace(
  '<th style={{ width: \'8%\' }}>เงินสตอรี่</th>',
  '<th style={{ width: \'9%\' }}>เงินสตอรี่</th>'
);
code = code.replace(
  '<th style={{ width: \'8%\' }}>เงินพี่เลี้ยง</th>',
  '<th style={{ width: \'9%\' }}>เงินพี่เลี้ยง</th>'
);
code = code.replace(
  '<th style={{ width: \'5%\' }}>กาชา IC</th>',
  '<th style={{ width: \'6%\' }}>กาชา IC</th>'
);
code = code.replace(
  '<th style={{ width: \'5%\' }}>หน่วยงาน</th>',
  '<th style={{ width: \'7%\' }}>หน่วยงาน</th>'
);
code = code.replace(
  '<th style={{ width: \'5%\' }}>Prem.</th>',
  '<th style={{ width: \'6%\' }}>Prem.</th>'
);
code = code.replace(
  '<th style={{ width: \'5%\' }}>Promo.</th>',
  '<th style={{ width: \'6%\' }}>Promo.</th>'
);
code = code.replace(
  '<th style={{ width: \'8%\' }}>เงิน OC</th>',
  '<th style={{ width: \'9%\' }}>เงิน OC</th>'
);
code = code.replace(
  '<th style={{ width: \'5%\' }}>เหรียญ</th>',
  '<th style={{ width: \'9%\' }}>เหรียญ</th>'
);

fs.writeFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', code);
