const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', 'utf-8');
const tableMatch = code.match(/<table[\s\S]*?<\/table>/);
if (tableMatch) {
  let table = tableMatch[0];
  let thead = table.match(/<thead>[\s\S]*?<\/thead>/)[0];
  console.log(thead);
}
