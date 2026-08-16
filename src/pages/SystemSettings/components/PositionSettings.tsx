import { useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Save, X } from 'lucide-react';
import { usePositions, useAddPosition, useUpdatePosition, useDeletePosition } from '../../../hooks/usePositions';
import type { Position } from '../../../hooks/usePositions';

export default function PositionSettings() {
  const { data: positions = [], isLoading } = usePositions();
  const addMutation = useAddPosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    rank: 0,
    ic_rate: 0,
    oc_rate: 0
  });

  const handleEdit = (pos: Position) => {
    setEditingId(pos.id);
    setFormData({
      name: pos.name,
      rank: pos.rank,
      ic_rate: pos.ic_rate || 0,
      oc_rate: pos.oc_rate || 0
    });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ name: '', rank: 1, ic_rate: 0, oc_rate: 0 });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
      } else {
        await addMutation.mutateAsync(formData);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save position:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตำแหน่งนี้?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete position:', err);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  if (isLoading) return <div>กำลังโหลดข้อมูล...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>การจัดการตำแหน่งงาน</h2>
        <button 
          onClick={handleAdd}
          disabled={isAdding || !!editingId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (isAdding || !!editingId) ? 'not-allowed' : 'pointer',
            opacity: (isAdding || !!editingId) ? 0.6 : 1
          }}
        >
          <Plus size={16} />
          เพิ่มตำแหน่ง
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr style={{ color: '#64748b' }}>
              <th style={{ padding: '1rem', width: '10%' }}>Rank</th>
              <th style={{ padding: '1rem', width: '30%' }}>ชื่อตำแหน่ง</th>
              <th style={{ padding: '1rem', width: '25%' }}>อัตราค่าเข้าเวร (IC Rate)</th>
              <th style={{ padding: '1rem', width: '25%' }}>อัตราค่าโอที (OC Rate)</th>
              <th style={{ padding: '1rem', width: '10%', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="number" 
                    value={formData.rank}
                    onChange={e => setFormData({...formData, rank: parseInt(e.target.value) || 0})}
                    style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="ระบุชื่อตำแหน่ง"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="number" 
                    value={formData.ic_rate}
                    onChange={e => setFormData({...formData, ic_rate: parseInt(e.target.value) || 0})}
                    style={{ width: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="number" 
                    value={formData.oc_rate}
                    onChange={e => setFormData({...formData, oc_rate: parseInt(e.target.value) || 0})}
                    style={{ width: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                    <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                </td>
              </tr>
            )}
            
            {positions.map(position => (
              <tr key={position.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                {editingId === position.id ? (
                  <>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="number" 
                        value={formData.rank}
                        onChange={e => setFormData({...formData, rank: parseInt(e.target.value) || 0})}
                        style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="number" 
                        value={formData.ic_rate}
                        onChange={e => setFormData({...formData, ic_rate: parseInt(e.target.value) || 0})}
                        style={{ width: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="number" 
                        value={formData.oc_rate}
                        onChange={e => setFormData({...formData, oc_rate: parseInt(e.target.value) || 0})}
                        style={{ width: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                        <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{position.rank}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{position.name}</td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: '500' }}>
                      ฿{position.ic_rate?.toLocaleString() || 0}
                    </td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: '500' }}>
                      ฿{position.oc_rate?.toLocaleString() || 0}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleEdit(position)} 
                          disabled={isAdding || !!editingId}
                          style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: (isAdding || !!editingId) ? 'not-allowed' : 'pointer', opacity: (isAdding || !!editingId) ? 0.5 : 1 }}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(position.id)}
                          disabled={isAdding || !!editingId}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: (isAdding || !!editingId) ? 'not-allowed' : 'pointer', opacity: (isAdding || !!editingId) ? 0.5 : 1 }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            
            {positions.length === 0 && !isAdding && (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  ไม่พบข้อมูลตำแหน่ง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', gap: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
        <AlertTriangle size={18} style={{ flexShrink: 0, color: '#f59e0b' }} />
        <p style={{ margin: 0 }}>
          <strong>ข้อควรระวัง:</strong> การลบหรือแก้ไขชื่อตำแหน่งอาจส่งผลกระทบต่อข้อมูลบุคลากร (Users) ที่ผูกกับตำแหน่งนั้นๆ อยู่ โปรดตรวจสอบให้แน่ใจก่อนทำการเปลี่ยนแปลง
        </p>
      </div>
    </div>
  );
}
