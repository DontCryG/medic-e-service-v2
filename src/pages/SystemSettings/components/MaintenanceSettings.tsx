import { useState, useEffect } from 'react';
import { 
  Wrench, 
  Save, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  RefreshCw,
  Power
} from 'lucide-react';
import { useMaintenanceMode, useSaveMaintenanceMode } from '@/hooks/useMaintenanceMode';
import type { MaintenanceConfig } from '@/hooks/useMaintenanceMode';
import { useAuthStore } from '@/store/authStore';
import { broadcastForceReload } from '@/hooks/useAppRealtime';
import { showConfirmDialog, showSuccessAlert, showErrorAlert } from '@/utils/alert';
import MaintenanceScreen from '@/components/common/MaintenanceScreen';

export default function MaintenanceSettings() {
  const { user } = useAuthStore();
  const { data: maintenance, isLoading } = useMaintenanceMode();
  const saveMutation = useSaveMaintenanceMode();

  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (maintenance) {
      setEnabled(maintenance.enabled);
      setTitle(maintenance.title || 'ระบบกำลังอยู่ระหว่างการพัฒนาและปรับปรุง');
      setMessage(maintenance.message || 'หน่วยงานแพทย์กำลังดำเนินการอัปเดตระบบ เพื่อเพิ่มประสิทธิภาพและความปลอดภัย กรุณากลับมาใช้งานใหม่อีกครั้งในภายหลัง');
      setEstimatedEnd(maintenance.estimated_end || '');
    }
  }, [maintenance]);

  const handleSave = async (newEnabledState?: boolean) => {
    const isEnabling = newEnabledState !== undefined ? newEnabledState : enabled;
    
    if (isEnabling && !title.trim()) {
      showErrorAlert('ข้อมูลไม่ครบ', 'กรุณาระบุหัวข้อการปิดปรับปรุง');
      return;
    }

    const actionText = isEnabling ? 'เปิดใช้งานโหมดปิดปรับปรุงระบบ' : 'ปิดโหมดปรับปรุงและเปิดระบบตามปกติ';
    const result = await showConfirmDialog({
      title: `${actionText}?`,
      text: isEnabling 
        ? 'เมื่อเปิดใช้งาน บุคลากรทั่วไปจะไม่สามารถเข้าสู่ระบบหรือใช้งานหน้าเว็บได้ (ผู้ดูแลระบบยังคงใช้งานได้ตามปกติ)' 
        : 'เมื่อปิด บุคลากรทุกคนจะสามารถเข้าใช้งานระบบได้ตามปกติทันที',
      icon: isEnabling ? 'warning' : 'question',
      confirmButtonText: isEnabling ? 'ยืนยันเปิดโหมดปรับปรุง' : 'เปิดระบบตามปกติ',
      confirmButtonColor: isEnabling ? '#d97706' : '#7e22ce'
    });

    if (result.isConfirmed) {
      const config: MaintenanceConfig = {
        enabled: isEnabling,
        title: title.trim(),
        message: message.trim(),
        estimated_end: estimatedEnd.trim(),
        updated_by: user?.ic_name || 'ผู้ดูแลระบบ',
        updated_at: new Date().toISOString()
      };

      saveMutation.mutate(config, {
        onSuccess: () => {
          showSuccessAlert(
            'บันทึกสำเร็จ!', 
            isEnabling 
              ? 'ระบบเข้าสู่โหมดปิดปรับปรุงแล้ว และส่งคำสั่งรีโหลดไปยังผู้ใช้ทั่วไปเรียบร้อยแล้ว' 
              : 'เปิดระบบให้ใช้งานตามปกติเรียบร้อยแล้ว'
          );
        },
        onError: (err: any) => {
          showErrorAlert('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
        }
      });
    }
  };

  const handleForceReload = async () => {
    const result = await showConfirmDialog({
      title: 'บังคับรีเฟรชผู้ใช้ทุกคน?',
      text: 'คำสั่งนี้จะส่งสัญญาณ Realtime ให้หน้าต่างเบราว์เซอร์ของผู้ใช้ทุกคนที่เปิดเว็บอยู่รีโหลดทันที',
      icon: 'warning',
      confirmButtonText: 'ยืนยันส่งสัญญาณ',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      broadcastForceReload();
      showSuccessAlert('ส่งคำสั่งเรียบร้อย', 'ส่งคำสั่งรีโหลดหน้าต่างไปยังผู้ใช้งานทุกคนแล้ว');
    }
  };

  const previewConfig: MaintenanceConfig = {
    enabled: true,
    title: title || 'ระบบกำลังอยู่ระหว่างการพัฒนาและปรับปรุง',
    message: message || 'หน่วยงานแพทย์กำลังดำเนินการอัปเดตระบบ กรุณากลับมาใช้งานใหม่อีกครั้งในภายหลัง',
    estimated_end: estimatedEnd,
    updated_by: user?.ic_name
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-medium">
        กำลังโหลดการตั้งค่าระบบ...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Top Status Card */}
      <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
        maintenance?.enabled 
          ? 'bg-amber-50/70 border-amber-200/90' 
          : 'bg-emerald-50/60 border-emerald-200/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              maintenance?.enabled 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {maintenance?.enabled ? <Wrench size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 m-0">สถานะโหมดปรับปรุงและพัฒนาระบบ</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  maintenance?.enabled 
                    ? 'bg-amber-500 text-white shadow-2xs' 
                    : 'bg-emerald-600 text-white shadow-2xs'
                }`}>
                  {maintenance?.enabled ? 'เปิดใช้งานอยู่ (Under Maintenance)' : 'ปิดใช้งาน (Normal Operation)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                {maintenance?.enabled 
                  ? 'ผู้ใช้งานทั่วไปไม่สามารถเข้าสู่ระบบได้ จะเห็นหน้าแจ้งเตือนปิดปรับปรุง (Admin ยังคงเข้าใช้งานได้)' 
                  : 'ระบบเปิดให้บุคลากรทุกคนเข้าใช้งานและลงชื่อเข้าเวรได้ตามปกติ'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSave(!maintenance?.enabled)}
            disabled={saveMutation.isPending}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all shadow-sm shrink-0 text-white ${
              maintenance?.enabled 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-amber-600 hover:bg-amber-700'
            } disabled:opacity-50`}
          >
            <Power size={14} />
            <span>{maintenance?.enabled ? 'ปิดโหมดปรับปรุง (เปิดระบบ)' : 'เปิดโหมดปรับปรุงระบบ'}</span>
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col gap-4 shadow-2xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 m-0">ข้อความและรายละเอียดที่แสดงให้ผู้ใช้เห็น</h4>
            <p className="text-xs text-slate-400 m-0 mt-0.5">กำหนดข้อความแจ้งเตือนบนหน้าจอของบุคลากรทั่วไปขณะปิดปรับปรุง</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="ดูตัวอย่างหน้าจอที่ผู้ใช้จะเห็น"
          >
            <Eye size={14} />
            <span>ดูตัวอย่างหน้าจอ</span>
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              หัวข้อการปิดปรับปรุง (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ระบบกำลังอยู่ระหว่างการพัฒนาและปรับปรุง"
              className="w-full px-3 py-2 rounded-lg border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ข้อความแจ้งเตือนและชี้แจง (Message)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="เช่น หน่วยงานแพทย์กำลังดำเนินการอัปเดตระบบ เพื่อเพิ่มประสิทธิภาพและความปลอดภัย กรุณากลับมาใช้งานใหม่อีกครั้งในภายหลัง"
              className="w-full px-3 py-2 rounded-lg border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 resize-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              เวลาที่คาดว่าจะแล้วเสร็จ (Estimated Time) <span className="text-slate-400 font-normal">(ระบุหรือไม่ก็ได้)</span>
            </label>
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={estimatedEnd}
                onChange={(e) => setEstimatedEnd(e.target.value)}
                placeholder="เช่น 18:30 น. หรือ วันนี้ เวลา 20:00 น."
                className="w-full !pl-9 pr-3 py-2 rounded-lg border border-slate-200/90 text-xs bg-slate-50/60 focus:bg-white text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleForceReload}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer transition-colors"
            title="สั่งให้หน้าเว็บของผู้ใช้ทุกคนรีโหลดทันที"
          >
            <RefreshCw size={13} />
            <span>บังคับรีเฟรชผู้ใช้ทุกคน (Force Reload)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer border-none transition-all shadow-sm disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าข้อความ'}</span>
          </button>
        </div>
      </div>

      {/* Info Advice Banner */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldAlert size={15} className="text-purple-600" />
          <span>คำแนะนำการใช้งานโหมดกำลังพัฒนา:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 m-0">
          <li>เมื่อเปิดโหมดนี้ ผู้ใช้งานทั่วไปที่ล็อกอินค้างอยู่จะถูกแสดงหน้าจอ <strong>Under Maintenance</strong> ทันทีผ่านระบบ Realtime</li>
          <li>ผู้ใช้งานที่ไม่ใช่ Admin จะไม่สามารถกดเข้าเวร, ส่งคำร้อง หรือทำรายการใดๆ ได้ระหว่างที่เปิดโหมดนี้</li>
          <li>ผู้ดูแลระบบ (Admin) ยังคงสามารถเข้าใช้งานและทดสอบระบบได้ตามปกติทุกหน้า พร้อมมีแถบแจ้งเตือนสีส้มที่ด้านบน</li>
          <li>เมื่อพัฒนาหรือแก้ไขระบบเสร็จสิ้นแล้ว สามารถกด <strong>"ปิดโหมดปรับปรุง (เปิดระบบ)"</strong> ได้ทุกเมื่อ</li>
        </ul>
      </div>

      {/* Fullscreen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex flex-col">
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold flex items-center gap-2">
              <Eye size={15} className="text-amber-400" />
              ตัวอย่างหน้าจอที่ผู้ใช้งานทั่วไปจะเห็น (Preview Mode)
            </span>
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md border-none cursor-pointer font-semibold transition-colors"
            >
              ปิดหน้าต่างตัวอย่าง (Close Preview)
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <MaintenanceScreen maintenance={previewConfig} onRetry={() => setShowPreview(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
