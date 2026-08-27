import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { 
  useGangs, useAddGang, useUpdateGang, useDeleteGang, 
  useFamilies, useAddFamily, useUpdateFamily, useDeleteFamily,
} from '../hooks/useGangsFamilies';
import Swal from 'sweetalert2';
import type { Gang, Family } from '../hooks/useGangsFamilies';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const groupSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อ')
});

type GroupFormValues = z.infer<typeof groupSchema>;

export default function GangFamilySettings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
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
  const processingRef = useRef(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' }
  });

  const filteredGangs = gangs.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (gang: Gang) => {
    setEditingId(gang.id);
    reset({ name: gang.name });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({ name: '' });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const onSubmit = async (data: GroupFormValues) => { 
    if (addMutation.isPending || updateMutation.isPending || processingRef.current) return; 
    processingRef.current = true; 
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, name: data.name });
      } else {
        await addMutation.mutateAsync(data.name);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err: any) { 
      console.error(err); 
      Swal.fire({ icon: 'error', title: 'Error', text: err.message }); 
    } finally { 
      processingRef.current = false; 
    }
  };

  const handleDelete = async (id: string) => { 
    if (deleteMutation.isPending || processingRef.current) return; 
    processingRef.current = true; 
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
      } catch (err: any) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete' }); 
      } finally { 
        processingRef.current = false; 
      } 
    } else { 
      processingRef.current = false; 
    } 
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800 m-0 shrink-0">รายชื่อ Gang</h2>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto flex-1 justify-end">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 -mt-[1px] text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="ค้นหาชื่อแก๊ง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full !pl-10 !pr-4 !py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-[var(--primary)] text-sm transition-colors"
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={isAdding || !!editingId}
            className="flex justify-end items-center gap-2 px-4 !py-2 bg-[var(--primary)] text-white border-none rounded-md text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
      </div>

      {isLoading ? <p className="text-center text-slate-500 py-8">กำลังโหลด...</p> : (
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
            <table className="w-full min-w-[500px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="text-slate-500 text-sm">
                  <th className="p-3.5 font-semibold">ชื่อแก๊ง</th>
                  <th className="p-3.5 font-semibold w-[120px] text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <td className="p-3">
                      <input 
                        type="text" 
                        {...register('name')}
                        placeholder="ระบุชื่อแก๊ง..."
                        className={`w-full px-3 !py-2 bg-white border ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-md outline-none focus:border-[var(--primary)] text-sm`}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 cursor-pointer"><Save size={16} /></button>
                        <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-red-50 text-red-500 border-none hover:bg-red-100 cursor-pointer"><X size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredGangs.length > 0 ? filteredGangs.map(gang => (
                  <tr key={gang.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {editingId === gang.id ? (
                      <>
                        <td className="p-3">
                          <input 
                            type="text" 
                            {...register('name')}
                            className={`w-full px-3 !py-2 bg-white border ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-md outline-none focus:border-[var(--primary)] text-sm`}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 cursor-pointer"><Save size={16} /></button>
                            <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-red-50 text-red-500 border-none hover:bg-red-100 cursor-pointer"><X size={16} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-slate-700 font-medium text-[0.95rem]">{gang.name}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(gang); }} disabled={isAdding || !!editingId} className="p-2 rounded-md bg-slate-100 text-slate-500 border-none hover:bg-slate-200 cursor-pointer disabled:opacity-50"><Edit2 size={16} /></button>
                            <button type="button" onClick={() => handleDelete(gang.id)} disabled={isAdding || !!editingId} className="p-2 rounded-md bg-red-50 text-red-500 border-none hover:bg-red-100 cursor-pointer disabled:opacity-50"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )) : (!isAdding && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400 text-sm">ไม่มีข้อมูล</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
          </div>
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
  const processingRef = useRef(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' }
  });

  const filteredFamilies = families.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (family: Family) => {
    setEditingId(family.id);
    reset({ name: family.name });
    setIsAdding(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({ name: '' });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const onSubmit = async (data: GroupFormValues) => { 
    if (addMutation.isPending || updateMutation.isPending || processingRef.current) return; 
    processingRef.current = true; 
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, name: data.name });
      } else {
        await addMutation.mutateAsync(data.name);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err: any) { 
      console.error(err); 
      Swal.fire({ icon: 'error', title: 'Error', text: err.message }); 
    } finally { 
      processingRef.current = false; 
    }
  };

  const handleDelete = async (id: string) => { 
    if (deleteMutation.isPending || processingRef.current) return; 
    processingRef.current = true; 
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
      } catch (err: any) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete' }); 
      } finally { 
        processingRef.current = false; 
      } 
    } else { 
      processingRef.current = false; 
    } 
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800 m-0 shrink-0">รายชื่อ Family</h2>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto flex-1 justify-end">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 -mt-[1px] text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="ค้นหาชื่อแฟมิลี่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full !pl-10 !pr-4 !py-2 bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-[var(--primary)] text-sm transition-colors"
            />
          </div>
          <button 
            onClick={handleAdd}
            disabled={isAdding || !!editingId}
            className="flex justify-end items-center gap-2 px-4 !py-2 bg-[var(--primary)] text-white border-none rounded-md text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
      </div>

      {isLoading ? <p className="text-center text-slate-500 py-8">กำลังโหลด...</p> : (
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
            <table className="w-full min-w-[500px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="text-slate-500 text-sm">
                  <th className="p-3.5 font-semibold">ชื่อแฟมิลี่</th>
                  <th className="p-3.5 font-semibold w-[120px] text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <td className="p-3">
                      <input 
                        type="text" 
                        {...register('name')}
                        placeholder="ระบุชื่อแฟมิลี่..."
                        className={`w-full px-3 !py-2 bg-white border ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-md outline-none focus:border-[var(--primary)] text-sm`}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 cursor-pointer"><Save size={16} /></button>
                        <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-red-50 text-red-500 border-none hover:bg-red-100 cursor-pointer"><X size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredFamilies.length > 0 ? filteredFamilies.map(family => (
                  <tr key={family.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {editingId === family.id ? (
                      <>
                        <td className="p-3">
                          <input 
                            type="text" 
                            {...register('name')}
                            className={`w-full px-3 !py-2 bg-white border ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'} rounded-md outline-none focus:border-[var(--primary)] text-sm`}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 cursor-pointer"><Save size={16} /></button>
                            <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-red-50 text-red-500 border-none hover:bg-red-100 cursor-pointer"><X size={16} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-slate-700 font-medium text-[0.95rem]">{family.name}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(family); }} disabled={isAdding || !!editingId} className="p-2 rounded-md bg-slate-100 text-slate-500 border-none hover:bg-slate-200 cursor-pointer disabled:opacity-50"><Edit2 size={16} /></button>
                            <button type="button" onClick={() => handleDelete(family.id)} disabled={isAdding || !!editingId} className="p-2 rounded-md bg-red-50 text-red-500 border-none hover:bg-red-100 cursor-pointer disabled:opacity-50"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )) : (!isAdding && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-400 text-sm">ไม่มีข้อมูล</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
