const fs = require('fs');

function processFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Add useRef
  content = content.replace(/import \{ useState \} from 'react';/, "import { useState, useRef } from 'react';");

  // Fix deleteMutation declarations
  content = content.replace(/const deleteMutation = (.*?);/g, "const deleteMutation = \;\n  const processingRef = useRef(false);");

  // Fix handleSave
  content = content.replace(/const handleSave = async \(\) => \{ if \(\!name\.trim\(\) \|\| addMutation\.isPending \|\| updateMutation\.isPending\) return;\r?\n\s+try \{[\s\S]*?\} catch \(err\) \{\s+console\.error\(err\);\s+Swal\.fire\(\{ icon: 'error', title: '.*?', text: '.*?' \}\);\s+\}\s+\};/g, 
  const handleSave = async () => { 
    if (!name.trim() || addMutation.isPending || updateMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, name });
      } else {
        await addMutation.mutateAsync(name);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: 'error', title: '???????', text: err.message });
    } finally {
      processingRef.current = false;
    }
  };);

  // Fix handleDelete
  content = content.replace(/const handleDelete = async \(id: string\) => \{ if \(deleteMutation\.isPending\) return;\r?\n\s+const result = await Swal\.fire\(\{[\s\S]*?\}\);\r?\n\r?\n\s+if \(result\.isConfirmed\) \{[\s\S]*?\}\s+\};/g,
  const handleDelete = async (id: string) => { 
    if (deleteMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    const result = await Swal.fire({
      title: '????????????',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: '??????',
      cancelButtonText: '??????'
    });

    if (result.isConfirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        console.error(err);
        Swal.fire({ icon: 'error', title: '???????', text: err.message });
      } finally {
        processingRef.current = false;
      }
    } else {
      processingRef.current = false;
    }
  };);

  fs.writeFileSync(path, content, 'utf8');
}
processFile('src/pages/SystemSettings/components/GangFamilySettings.tsx');
