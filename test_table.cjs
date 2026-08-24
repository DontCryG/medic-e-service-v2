const fs = require('fs');
let code = fs.readFileSync('src/pages/SalarySystem/components/SalaryReportModal.tsx', 'utf-8');
const tableMatch = code.match(/<table[\s\S]*?<\/table>/);
if (tableMatch) {
  let table = tableMatch[0];
  let thead = table.match(/<thead>[\s\S]*?<\/thead>/)[0];
  let tbody = table.match(/<tbody>[\s\S]*?<\/tbody>/)[0];
  let tfoot = table.match(/<tfoot>[\s\S]*?<\/tfoot>/)[0];
  
  console.log('Thead rows:', (thead.match(/<tr/g) || []).length);
  console.log('Thead cols row 1:', (thead.match(/<th.*?>/g) || []).length); // not accurate for colspans
}
