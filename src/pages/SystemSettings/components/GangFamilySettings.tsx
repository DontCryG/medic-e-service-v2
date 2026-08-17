import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { 
  useGangs, useAddGang, useUpdateGang, useDeleteGang, 
  useFamilies, useAddFamily, useUpdateFamily, useDeleteFamily,
} from '../hooks/useGangsFamilies';
import Swal from 'sweetalert2';
import type { Gang, Family } from '../hooks/useGangsFamilies';

export default function GangFamilySettings() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <GangSettings />
      <FamilySettings />
    </div>
  );
}

function GangSettings() {
  const { data: gangs = [], isLoading } = useGangs();
  const addMutation = useAddGang();
  const updateMutation = useUpdateGang();
  const deleteMutation = useDeleteGang();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');

  const filteredGangs = gangs.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (gang: Gang) => {
    setEditingId(gang.id);
    setName(gang.name);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, name });
      } else {
        await addMutation.mutateAsync(name);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
      }
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>รายชื่อ Gang</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text"
            placeholder="ค้นหาชื่อแก๊ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <button 
            onClick={handleAdd}
            disabled={isAdding || !!editingId}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: (isAdding || !!editingId) ? 'not-allowed' : 'pointer', opacity: (isAdding || !!editingId) ? 0.6 : 1 }}
          >
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
      </div>

      {isLoading ? <p>กำลังโหลด...</p> : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr style={{ color: '#64748b' }}>
                <th style={{ padding: '1rem' }}>ชื่อแก๊ง</th>
                <th style={{ padding: '1rem', width: '100px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="ระบุชื่อแก๊ง..."
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                      <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredGangs.map(gang => (
                <tr key={gang.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {editingId === gang.id ? (
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      gang.name
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {editingId === gang.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                        <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(gang)} disabled={isAdding || !!editingId} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(gang.id)} disabled={isAdding || !!editingId} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredGangs.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>ไม่มีข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FamilySettings() {
  const { data: families = [], isLoading } = useFamilies();
  const addMutation = useAddFamily();
  const updateMutation = useUpdateFamily();
  const deleteMutation = useDeleteFamily();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');

  const filteredFamilies = families.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (family: Family) => {
    setEditingId(family.id);
    setName(family.name);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, name });
      } else {
        await addMutation.mutateAsync(name);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
      }
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>รายชื่อ Family</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text"
            placeholder="ค้นหาชื่อแฟมิลี่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <button 
            onClick={handleAdd}
            disabled={isAdding || !!editingId}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: (isAdding || !!editingId) ? 'not-allowed' : 'pointer', opacity: (isAdding || !!editingId) ? 0.6 : 1 }}
          >
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
      </div>

      {isLoading ? <p>กำลังโหลด...</p> : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr style={{ color: '#64748b' }}>
                <th style={{ padding: '1rem' }}>ชื่อแฟมิลี่</th>
                <th style={{ padding: '1rem', width: '100px', textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="ระบุชื่อแฟมิลี่..."
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                      <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredFamilies.map(family => (
                <tr key={family.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {editingId === family.id ? (
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    ) : (
                      family.name
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {editingId === family.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                        <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(family)} disabled={isAdding || !!editingId} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(family.id)} disabled={isAdding || !!editingId} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredFamilies.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>ไม่มีข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
