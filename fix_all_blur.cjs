const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const cssFiles = walk('src');

cssFiles.forEach(file => {
  let code = fs.readFileSync(file, 'utf-8');
  let changed = false;

  if (code.includes('/* backdrop-filter: blur(4px); Removed for performance */')) {
    code = code.replace(/\/\*\s*backdrop-filter:\s*blur\(4px\);\s*Removed for performance\s*\*\//g, 'backdrop-filter: blur(4px);');
    changed = true;
  }
  
  if (code.includes('.modal-overlay {') && !code.includes('backdrop-filter:')) {
    code = code.replace(/(\.modal-overlay\s*\{[^}]*?background:\s*rgba[^;]+;)/, '\n  backdrop-filter: blur(4px);');
    changed = true;
  }

  if (changed) {
    console.log('Fixed', file);
    fs.writeFileSync(file, code);
  }
});
