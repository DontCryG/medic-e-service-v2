const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/QueueSystem/components/HistoryModal.tsx',
  'src/pages/QueueSystem/components/QueueRow.tsx',
  'src/pages/QueueSystem/hooks/useQueueMutations.ts',
  'src/pages/SystemSettings/components/GangFamilySettings.tsx',
  'src/pages/SystemSettings/components/PositionSettings.tsx',
  'src/pages/SystemSettings/components/PricingSettings.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('alert(')) {
      if (!content.includes('import Swal')) {
        content = content.replace(/(import.*?;?\n)/, '$1import Swal from \'sweetalert2\';\n');
      }

      // Replace alert('string literal')
      content = content.replace(/alert\((['"`])(.*?)\1\)/g, "Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: '$2' })");
      
      // Replace alert('string literal ' + variable)
      content = content.replace(/alert\((['"`].*?['"`])\s*\+\s*([a-zA-Z0-9_.*?]+)\)/g, "Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: $1 + $2 })");

      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
