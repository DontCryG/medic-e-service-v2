const fs = require('fs');

function processFile(path, saveName, deleteName) {
  let content = fs.readFileSync(path, 'utf8');

  // 1. Add useRef
  content = content.replace(/import \{ useState \} from 'react';/, "import { useState, useRef } from 'react';");

  // 2. Add processingRef after mutations
  content = content.replace(
    new RegExp('const deleteMutation = (.*?);\\r?\\n', 'g'),
    'const deleteMutation = \;\n  const processingRef = useRef(false);\n'
  );

  // 3. Fix handleSave
  // Find handleSave = async () => { ... }
  content = content.replace(
    /const handleSave = async \(\) => \{\s+if \([^\}]+\} catch \(err([^\{]*)\) \{\s+([^\}]+)\s+\}/g,
    (match, p1, p2) => {
      // Just replacing the declaration to inject processingRef
      return match;
    }
  );

  fs.writeFileSync(path, content, 'utf8');
}
