const fs = require('fs');
const files = [
  'src/pages/AccountingSystem/AccountingSystem.tsx',
  'src/pages/LeaveSystem.tsx',
  'src/pages/SalarySystem.tsx'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/className="[^"]*animate-fade-in[^"]*"/g, (match) => {
    return match.replace('animate-fade-in', '').replace(/  +/g, ' ').replace(/className=" "/g, 'className=""');
  });
  code = code.replace(/className="salary-system-container animate-fade-in"/g, 'className="salary-system-container"');
  code = code.replace(/className="animate-fade-in"/g, 'className=""');
  fs.writeFileSync(file, code);
});
