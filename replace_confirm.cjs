const fs = require('fs');
const path = require('path');

function replaceConfirm(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('window.confirm')) return;
  
  if (!content.includes('import Swal')) {
    content = content.replace(/(import.*?;?\n)/, '$1import Swal from \'sweetalert2\';\n');
  }

  const regex = /if\s*\(\s*window\.confirm\(\s*['"`](.*?)['"`]\s*\)\s*\)\s*\{([\s\S]*?)\}\s*catch\s*\(err\)\s*\{/g;
  
  content = content.replace(regex, (match, message, tryBlock) => {
    return `const result = await Swal.fire({
      title: '${message}',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {${tryBlock}} catch (err) {`;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

const files = [
  'src/pages/SystemSettings/components/GangFamilySettings.tsx',
  'src/pages/SystemSettings/components/PositionSettings.tsx',
  'src/pages/SystemSettings/components/PricingSettings.tsx'
];

files.forEach(f => replaceConfirm(path.join(__dirname, f)));
