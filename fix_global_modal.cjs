const fs = require('fs');

const indexCssPath = 'src/index.css';
let indexCss = fs.readFileSync(indexCssPath, 'utf8');

if (!indexCss.includes('Global Modal Styles')) {
  indexCss = indexCss + `
/* Global Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
  position: relative;
}
`;
  fs.writeFileSync(indexCssPath, indexCss);
}

// Remove from other files
const files = [
  'src/pages/PersonnelSystem.css',
  'src/pages/SalarySystem.css',
  'src/pages/QueueSystem/QueueModal.css'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Remove .modal-overlay {...} and .modal-content {...}
    code = code.replace(/\.modal-overlay\s*\{[^}]+\}/g, '');
    code = code.replace(/\.modal-content\s*\{[^}]+\}/g, '');
    code = code.replace(/\.personnel-modal-overlay\s*\{[^}]+\}/g, '');
    code = code.replace(/\.personnel-modal-content\s*\{[^}]+\}/g, '');
    fs.writeFileSync(file, code);
  }
});
