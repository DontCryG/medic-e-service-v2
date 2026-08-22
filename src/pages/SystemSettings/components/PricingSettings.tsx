import { useState } from 'react';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useSystemSettings, useSaveSystemSetting, useDeleteSystemSetting } from '../hooks/useSystemSettings';
import type { SystemSetting } from '../hooks/useSystemSettings';

export default function PricingSettings() {
  const { data: settings = [], isLoading } = useSystemSettings();
  const saveMutation = useSaveSystemSetting();
  const deleteMutation = useDeleteSystemSetting();

  const [isAdding, setIsAdding] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SystemSetting>({
    key: '',
    value: '',
    description: '',
    type: 'number'
  });

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setFormData(setting);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingKey(null);
    setFormData({ key: '', value: '', description: '', type: 'number' });
  };

  const handleSave = async () => { if (saveMutation.isPending) return;
    if (!formData.key.trim() || !formData.value.trim()) {
      Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: 'กรุณากรอก Key และ Value ให้ครบถ้วน' });
      return;
    }
    
    try {
      await saveMutation.mutateAsync(formData);
      setIsAdding(false);
      setEditingKey(null);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
  };

  const handleDelete = async (key: string) => { if (deleteMutation.isPending) return;
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่ว่าต้องการลบการตั้งค่า ${key}?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await deleteMutation.mutateAsync(key);
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'แจ้งเตือน', text: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
      }
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingKey(null);
  };

  if (isLoading) return <div>กำลังโหลด...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>ตั้งค่าทั่วไปและเรทราคา</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>จัดการตัวแปรและราคามาตรฐานที่ใช้ในระบบทั้งหมด</p>
        </div>
        <button 
          onClick={handleAdd}
          disabled={isAdding || !!editingKey}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: (isAdding || !!editingKey) ? 'not-allowed' : 'pointer', opacity: (isAdding || !!editingKey) ? 0.6 : 1 }}
        >
          <Plus size={16} /> เพิ่มตัวแปร
        </button>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr style={{ color: '#64748b' }}>
              <th style={{ padding: '1rem', width: '25%' }}>Key (รหัสอ้างอิง)</th>
              <th style={{ padding: '1rem', width: '30%' }}>รายละเอียด</th>
              <th style={{ padding: '1rem', width: '20%' }}>ค่า (Value)</th>
              <th style={{ padding: '1rem', width: '15%' }}>ประเภท</th>
              <th style={{ padding: '1rem', width: '10%', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="text" 
                    value={formData.key}
                    onChange={e => setFormData({...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                    placeholder="e.g. basic_treatment"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="อธิบายการใช้งาน..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <input 
                    type="text" 
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: e.target.value})}
                    placeholder="ระบุค่า"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="number">ตัวเลข</option>
                    <option value="text">ข้อความ</option>
                    <option value="boolean">เปิด/ปิด</option>
                  </select>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                    <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                </td>
              </tr>
            )}
            
            {settings.map(setting => (
              <tr key={setting.key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                {editingKey === setting.key ? (
                  <>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="text" 
                        value={formData.key}
                        disabled
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#e2e8f0' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="text" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        type="text" 
                        value={formData.value}
                        onChange={e => setFormData({...formData, value: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="number">ตัวเลข</option>
                        <option value="text">ข้อความ</option>
                        <option value="boolean">เปิด/ปิด</option>
                      </select>
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
                    <td style={{ padding: '1rem', fontWeight: '500', fontFamily: 'monospace' }}>{setting.key}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{setting.description || '-'}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {setting.type === 'number' && !isNaN(Number(setting.value)) 
                        ? Number(setting.value).toLocaleString() 
                        : setting.value}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', background: '#e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {setting.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(setting)} disabled={isAdding || !!editingKey} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(setting.key)} disabled={isAdding || !!editingKey} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            
            {settings.length === 0 && !isAdding && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>ยังไม่มีการตั้งค่า</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



