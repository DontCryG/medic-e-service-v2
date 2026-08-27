import { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { useSystemSettings, useSaveSystemSetting, useDeleteSystemSetting } from '../hooks/useSystemSettings';
import type { SystemSetting } from '../hooks/useSystemSettings';
import { useForm, Controller } from 'react-hook-form';
import SmartSelect from '@/components/common/SmartSelect';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const TYPE_OPTIONS = [
  { value: 'number', label: 'NUMBER' },
  { value: 'text', label: 'TEXT' },
  { value: 'boolean', label: 'BOOLEAN' },
  { value: 'json', label: 'JSON' }
];

const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'TRUE' },
  { value: 'false', label: 'FALSE' }
];

const pricingSchema = z.object({
  key: z.string().min(1, 'กรุณากรอก Key'),
  description: z.string().optional().nullable(),
  value: z.string().min(1, 'กรุณาระบุค่า'),
  type: z.enum(['number', 'text', 'boolean', 'json'])
});

type PricingFormValues = z.infer<typeof pricingSchema>;

export default function PricingSettings() {
  const { data: settings = [], isLoading } = useSystemSettings();
  const saveMutation = useSaveSystemSetting();
  const deleteMutation = useDeleteSystemSetting();
  const processingRef = useRef(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { register, control, handleSubmit, reset, formState: { errors }, watch } = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      key: '',
      description: '',
      value: '',
      type: 'number'
    }
  });

  const selectedType = watch('type');

  const filteredSettings = settings.filter(s => 
    s.key.toLowerCase().includes(search.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    reset({
      key: setting.key,
      description: setting.description || '',
      value: setting.value,
      type: setting.type as any || 'number'
    });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingKey(null);
    reset({ key: '', description: '', value: '', type: 'number' });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingKey(null);
  };

  const onSubmit = async (data: PricingFormValues) => { 
    if (saveMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    try {
      await saveMutation.mutateAsync({
        key: data.key,
        description: data.description || '',
        value: data.value,
        type: data.type
      });
      setIsAdding(false);
      setEditingKey(null);
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      processingRef.current = false;
    }
  };

  const handleDelete = async (key: string) => { 
    if (deleteMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    
    const result = await Swal.fire({
      title: `ยืนยันการลบค่าบริการ ${key}?`,
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
      } catch (err: any) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
      } finally {
        processingRef.current = false;
      }
    } else {
      processingRef.current = false;
    }
  };

  if (isLoading) return <div className="text-center p-8 text-slate-500">กำลังโหลด...</div>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-wrap justify-between items-start sm:items-center gap-4 mb-6">
        <div className="shrink-0">
            <h2 className="text-xl font-semibold text-slate-800 m-0 mb-1">ตั้งค่าทั่วไปและเรทราคา</h2>
          <p className="text-sm text-slate-500 m-0">จัดการตัวแปรและราคามาตรฐานที่ใช้ในระบบทั้งหมด</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto flex-1 justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 -mt-[1px] text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="ค้นหา Key หรือคำอธิบาย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full !pl-10 !pr-4 !py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-[var(--primary)] text-sm transition-colors"
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={isAdding || !!editingKey}
            className="flex items-center justify-center gap-2 px-4 !py-2 bg-[var(--primary)] text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> เพิ่มตัวแปร
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 text-[0.95rem]">
                  <th className="p-4 font-semibold w-[25%]">รหัสอ้างอิง (Key)</th>
                  <th className="p-4 font-semibold w-[30%]">รายละเอียด</th>
                  <th className="p-4 font-semibold w-[20%]">ค่า (Value)</th>
                  <th className="p-4 font-semibold w-[15%]">ประเภท</th>
                  <th className="p-4 font-semibold w-[10%] text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <td className="p-3">
                      <input 
                        type="text" 
                        {...register('key', {
                          onChange: (e) => e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '_')
                        })}
                        placeholder="e.g. basic_treatment"
                        className={`w-full !p-2.5 rounded-md border ${errors.key ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        {...register('description')}
                        placeholder="อธิบายการใช้งาน..."
                        className="w-full !p-2.5 rounded-md border border-slate-300 outline-none focus:border-[var(--primary)]"
                      />
                    </td>
                    <td className="p-3">
                      {selectedType === 'boolean' ? (
                        <Controller
  name="value"
  control={control}
  render={({ field }) => (
    <SmartSelect 
      options={BOOLEAN_OPTIONS}
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
                      ) : (
                        <input 
                          type="text" 
                          {...register('value')}
                          placeholder="ระบุค่า"
                          className={`w-full !p-2.5 rounded-md border ${errors.value ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                        />
                      )}
                    </td>
                    <td className="p-3">
                      <Controller
  name="type"
  control={control}
  render={({ field }) => (
    <SmartSelect 
      options={TYPE_OPTIONS}
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50" disabled={saveMutation.isPending}><Save size={18} /></button>
                        <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-slate-100 text-slate-500 border-none hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"><X size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {filteredSettings.length > 0 ? filteredSettings.map(setting => (
                  <tr key={setting.key} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {editingKey === setting.key ? (
                      <>
                        <td className="p-3">
                          <input 
                            type="text" 
                            {...register('key', {
                              onChange: (e) => e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '_')
                            })}
                            disabled={true}
                            className={`w-full !p-2.5 rounded-md border border-slate-200 bg-slate-100 text-slate-500 outline-none`}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            {...register('description')}
                            className="w-full !p-2.5 rounded-md border border-slate-300 outline-none focus:border-[var(--primary)]"
                          />
                        </td>
                        <td className="p-3">
                          {selectedType === 'boolean' ? (
                            <Controller
  name="value"
  control={control}
  render={({ field }) => (
    <SmartSelect 
      options={BOOLEAN_OPTIONS}
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
                          ) : (
                            <input 
                              type="text" 
                              {...register('value')}
                              className={`w-full !p-2.5 rounded-md border ${errors.value ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                            />
                          )}
                        </td>
                        <td className="p-3">
                          <Controller
  name="type"
  control={control}
  render={({ field }) => (
    <SmartSelect 
      options={TYPE_OPTIONS}
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50" disabled={saveMutation.isPending}><Save size={18} /></button>
                            <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-slate-100 text-slate-500 border-none hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"><X size={18} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-slate-700 font-semibold">{setting.key}</td>
                        <td className="p-4 text-slate-600">{setting.description || '-'}</td>
                        <td className="p-4">
  <div className="max-w-[400px] max-h-[120px] overflow-y-auto break-all pr-2">
    {setting.type === 'boolean' ? (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${setting.value === 'true' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {setting.value === 'true' ? 'TRUE' : 'FALSE'}
      </span>
    ) : setting.type === 'number' ? (
      <span className="text-slate-700 font-medium">{Number(setting.value).toLocaleString()}</span>
    ) : (
      <span className="text-slate-600">{setting.value}</span>
    )}
  </div>
</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium uppercase">
                            {setting.type || 'number'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(setting); }} 
                              disabled={isAdding || !!editingKey} 
                              className="p-2 rounded-md border border-slate-200 text-blue-500 bg-white hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDelete(setting.key)} 
                              disabled={isAdding || !!editingKey} 
                              className="p-2 rounded-md border border-slate-200 text-red-500 bg-white hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )) : (!isAdding && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                      ยังไม่มีการตั้งค่า
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
        </div>
      </div>
    </div>
  );
}
