import { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { Plus, Edit2, Trash2, AlertTriangle, Save, X } from 'lucide-react';
import { usePositions, useAddPosition, useUpdatePosition, useDeletePosition } from '../../../hooks/usePositions';
import type { Position } from '../../../hooks/usePositions';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const positionSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อตำแหน่ง'),
  rank: z.number({ message: "Required" }).min(0, 'ระดับต้องมากกว่าหรือเท่ากับ 0'),
  ic_rate: z.number({ message: "Required" }).min(0, 'เรทต้องไม่ติดลบ'),
  oc_rate: z.number({ message: "Required" }).min(0, 'ส่วนแบ่งต้องไม่ติดลบ'),
});

type PositionFormValues = z.infer<typeof positionSchema>;

export default function PositionSettings() {
  const { data: positions = [], isLoading } = usePositions();
  const addMutation = useAddPosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();
  const processingRef = useRef(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: '',
      rank: 1,
      ic_rate: 0,
      oc_rate: 0
    }
  });

  const handleEdit = (pos: Position) => {
    setEditingId(pos.id);
    reset({
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
    reset({ name: '', rank: 1, ic_rate: 0, oc_rate: 0 });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const onSubmit = async (data: PositionFormValues) => { 
    if (addMutation.isPending || updateMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
      } else {
        await addMutation.mutateAsync(data);
      }
      setIsAdding(false);
      setEditingId(null);
    } catch (err: any) {
      console.error('Failed to save position:', err);
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
    } finally {
      processingRef.current = false;
    }
  };

  const handleDelete = async (id: string) => { 
    if (deleteMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    const result = await Swal.fire({
      title: 'ยืนยันการลบตำแหน่งนี้?',
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
        console.error('Failed to delete position:', err);
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message });
      } finally {
        processingRef.current = false;
      }
    } else {
      processingRef.current = false;
    }
  };

  if (isLoading) return <div className="text-center p-8 text-slate-500">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 m-0">การจัดการตำแหน่งงาน</h2>
        <button 
          onClick={handleAdd}
          disabled={isAdding || !!editingId}
          className="flex items-center gap-2 px-4 !py-2 bg-[var(--primary)] text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          เพิ่มตำแหน่ง
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex gap-3 text-amber-800">
        <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-500" />
        <div>
          <strong className="block mb-1">ข้อควรระวัง:</strong>
          <span className="text-sm">การลบหรือแก้ไขชื่อตำแหน่งอาจส่งผลกระทบต่อข้อมูลบุคลากร ที่ผูกกับตำแหน่งนั้นๆ อยู่ โปรดตรวจสอบให้แน่ใจก่อนทำการเปลี่ยนแปลง</span>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 text-[0.95rem]">
                  <th className="p-4 font-semibold w-[10%]">Rank</th>
                  <th className="p-4 font-semibold w-[30%]">ชื่อตำแหน่ง</th>
                  <th className="p-4 font-semibold w-[25%]">อัตราค่าเข้าเวร (IC Rate)</th>
                  <th className="p-4 font-semibold w-[25%]">อัตราค่าโอที (OC Rate)</th>
                  <th className="p-4 font-semibold w-[10%] text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <td className="p-3">
                      <input 
                        type="number"
                        {...register('rank')}
                        className={`w-full !p-2.5 rounded-md border ${errors.rank ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        {...register('name')}
                        placeholder="ระบุชื่อตำแหน่ง"
                        className={`w-full !p-2.5 rounded-md border ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                      />
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
                        <input 
                          type="number" 
                          {...register('ic_rate')}
                          className={`w-full !p-2.5 !pl-8 rounded-md border ${errors.ic_rate ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
                        <input 
                          type="number" 
                          {...register('oc_rate')}
                          className={`w-full !p-2.5 !pl-8 rounded-md border ${errors.oc_rate ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50" disabled={addMutation.isPending || updateMutation.isPending}>
                          <Save size={18} />
                        </button>
                        <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-slate-100 text-slate-500 border-none hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50" disabled={addMutation.isPending || updateMutation.isPending}>
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {positions.length > 0 ? positions.map(pos => (
                  <tr key={pos.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    {editingId === pos.id ? (
                      <>
                        <td className="p-3">
                          <input 
                            type="number"
                            {...register('rank')}
                            className={`w-full !p-2.5 rounded-md border ${errors.rank ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            {...register('name')}
                            className={`w-full !p-2.5 rounded-md border ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                          />
                        </td>
                        <td className="p-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
                            <input 
                              type="number" 
                              {...register('ic_rate')}
                              className={`w-full !p-2.5 !pl-8 rounded-md border ${errors.ic_rate ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">฿</span>
                            <input 
                              type="number" 
                              {...register('oc_rate')}
                              className={`w-full !p-2.5 !pl-8 rounded-md border ${errors.oc_rate ? 'border-red-400 bg-red-50' : 'border-slate-300'} outline-none focus:border-[var(--primary)]`}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button type="submit" className="p-2 rounded-md bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50" disabled={addMutation.isPending || updateMutation.isPending}>
                              <Save size={18} />
                            </button>
                            <button type="button" onClick={cancelEdit} className="p-2 rounded-md bg-slate-100 text-slate-500 border-none hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50" disabled={addMutation.isPending || updateMutation.isPending}>
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-slate-700 font-medium">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">
                            {pos.rank}
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 font-semibold">{pos.name}</td>
                        <td className="p-4 text-slate-600">฿{pos.ic_rate?.toLocaleString() || 0}</td>
                        <td className="p-4 text-slate-600">฿{pos.oc_rate?.toLocaleString() || 0}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(pos); }} 
                              disabled={isAdding || !!editingId} 
                              className="p-2 rounded-md border border-slate-200 text-blue-500 bg-white hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDelete(pos.id)} 
                              disabled={isAdding || !!editingId} 
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
                      ไม่พบข้อมูลตำแหน่ง
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
