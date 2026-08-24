const fs = require('fs');
const path = 'src/pages/SalarySystem/components/SalaryTable.tsx';
let code = fs.readFileSync(path, 'utf-8');

code = code.replace(/<th style=\{\{ textAlign: 'right' \}\}>รวมสุทธิ \(IC\)<\/th>\r?\n\s*/, '');
code = code.replace(/<td style=\{\{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' \}\}>\r?\n\s*\{\(item\.ic_salary \+ item\.story_money \+ \(item\.mentor_money \|\| 0\)\)\.toLocaleString\(\)\}\r?\n\s*<\/td>\r?\n\s*/g, '');

fs.writeFileSync(path, code);
