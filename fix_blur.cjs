const fs = require('fs');

const files = [
  'src/pages/PersonnelSystem.css',
  'src/pages/QueueSystem/QueueModal.css',
  'src/pages/SalarySystem.css',
  'src/pages/AccountingSystem.css',
  'src/pages/DutySystem.css'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    
    // Replace commented out backdrop-filter with active one
    code = code.replace(/\/\*\s*backdrop-filter:\s*blur\(4px\);\s*Removed for performance\s*\*\//g, 'backdrop-filter: blur(4px);');
    
    // Just in case it's completely missing but has background, let's add it
    if (code.includes('.modal-overlay {') && !code.includes('backdrop-filter: blur(4px);')) {
      code = code.replace(/(\.modal-overlay\s*\{[^}]*?background:\s*rgba[^;]+;)/, '\n  backdrop-filter: blur(4px);');
    }

    fs.writeFileSync(file, code);
  }
});

// Also check index.css to see if it has a global one
let indexCss = fs.readFileSync('src/index.css', 'utf-8');
if (!indexCss.includes('.modal-overlay {') || indexCss.indexOf('.modal-overlay {') > indexCss.indexOf('@media')) {
  // It only has the media query one, let's inject a global one just in case
  // Actually, wait, it's already defined in the page css files.
}
