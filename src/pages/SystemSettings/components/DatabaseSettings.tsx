import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  Sparkles, 
  Clock, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '@/lib/api';
import { showConfirmDialog, showSuccessAlert, showErrorAlert } from '@/utils/alert';

interface CleanupConfig {
  autoEnabled: boolean;
  staleShiftEnabled: boolean;
  staleShiftHours: number;
  queueResetEnabled: boolean;
  dutyRetentionDays: number;
  leaveRetentionDays: number;
  auditRetentionDays: number;
}

interface CleanupReport {
  staleShiftsClosed: number;
  queueResetCount: number;
  dutyLogsPurged: number;
  leavesPurged: number;
  auditsPurged: number;
  executedAt: string;
  triggerType: string;
}

interface CleanupStatusResponse {
  config: CleanupConfig;
  lastRun?: string | null;
  lastReport?: CleanupReport | null;
}

const DEFAULT_CONFIG: CleanupConfig = {
  autoEnabled: true,
  staleShiftEnabled: true,
  staleShiftHours: 6,
  queueResetEnabled: true,
  dutyRetentionDays: 60,
  leaveRetentionDays: 90,
  auditRetentionDays: 90,
};

export default function DatabaseSettings() {
  const queryClient = useQueryClient();

  const { data: statusData, isLoading } = useQuery<CleanupStatusResponse>({
    queryKey: ['db_cleanup_status'],
    queryFn: async () => {
      return await api.database.getCleanupStatus();
    },
    staleTime: 10 * 1000,
  });

  const [form, setForm] = useState<CleanupConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (statusData?.config) {
      setForm(statusData.config);
    }
  }, [statusData]);

  const saveMutation = useMutation({
    mutationFn: async (cfg: CleanupConfig) => {
      return await api.database.saveCleanupConfig(cfg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db_cleanup_status'] });
      showSuccessAlert('บันทึกสำเร็จ!', 'บันทึกการตั้งค่านโยบายทำความสะอาดฐานข้อมูลเรียบร้อยแล้ว');
    },
    onError: (err: any) => {
      showErrorAlert('บันทึกไม่สำเร็จ', err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    },
  });

  const cleanNowMutation = useMutation({
    mutationFn: async (resetQueue: boolean) => {
      return await api.database.cleanNow(resetQueue);
    },
    onSuccess: (data: CleanupReport) => {
      queryClient.invalidateQueries({ queryKey: ['db_cleanup_status'] });
      queryClient.invalidateQueries({ queryKey: ['duty_logs'] });
      queryClient.invalidateQueries({ queryKey: ['queue_status'] });

      const totalItems = 
        data.staleShiftsClosed + 
        data.queueResetCount + 
        data.dutyLogsPurged + 
        data.leavesPurged + 
        data.auditsPurged;

      showSuccessAlert(
        'ทำความสะอาดสำเร็จ!',
        `จัดระเบียบฐานข้อมูลเรียบร้อย:\n` +
        `• เคลียร์เวรค้าง: ${data.staleShiftsClosed} รายการ\n` +
        `• รีเซ็ตคิวแพทย์: ${data.queueResetCount} คน\n` +
        `• ลบประวัติเวรเก่า: ${data.dutyLogsPurged} รายการ\n` +
        `• ลบคำขอลางานเก่า: ${data.leavesPurged} รายการ\n` +
        `• ลบ Audit Logs เก่า: ${data.auditsPurged} รายการ\n` +
        `รวมทั้งหมด: ${totalItems} รายการ`
      );
    },
    onError: (err: any) => {
      showErrorAlert('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถสั่งทำความสะอาดได้');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const handleCleanNow = async () => {
    const result = await showConfirmDialog({
      title: 'ทำความสะอาดฐานข้อมูลทันที?',
      text: 'ระบบจะทำการตรวจสอบและเคลียร์เวรค้าง, ลบประวัติเวรเก่า และคำขอลางานที่เกินกำหนดนโยบายทันที',
      icon: 'warning',
      confirmButtonText: 'ใช่, ทำความสะอาดเลย',
      confirmButtonColor: '#7e22ce',
    });

    if (result.isConfirmed) {
      cleanNowMutation.mutate(false);
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'ยังไม่มีข้อมูลการรัน';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-medium">
        กำลังโหลดข้อมูลการตั้งค่าฐานข้อมูล...
      </div>
    );
  }

  const lastReport = statusData?.lastReport;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* 1. Header Banner & Status Card */}
      <div className="p-5 rounded-xl border bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/60 border-purple-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 m-0">ระบบทำความสะอาดฐานข้อมูลอัตโนมัติ (Auto-Cleanup)</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  form.autoEnabled 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'bg-slate-400 text-white'
                }`}>
                  {form.autoEnabled ? 'เปิดทำงาน 24/7' : 'ปิดใช้งาน'}
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 mt-1">
                ตัดรอบเวรค้างอัตโนมัติ, รีเซ็ตคิวแพทย์ประจำวัน, และลบประวัติเก่าที่หมดอายุ เพื่อให้ Database ทำงานได้ลื่นไหล ไม่เกินโควต้า
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleCleanNow}
              disabled={cleanNowMutation.isPending}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="เริ่มล้างข้อมูลตามนโยบายทันที"
            >
              <Sparkles size={14} className={cleanNowMutation.isPending ? 'animate-spin' : ''} />
              <span>{cleanNowMutation.isPending ? 'กำลังประมวลผล...' : 'ล้างข้อมูลทันที (Clean Now)'}</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-purple-100/80">
          <div className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-lg border border-purple-100">
            <Clock size={16} className="text-purple-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">รอบการรันล่าสุด</div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {formatDateTime(statusData?.lastRun)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-lg border border-purple-100">
            <Activity size={16} className="text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">ผลลัพธ์รอบล่าสุด</div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {lastReport 
                  ? `เคลียร์ ${lastReport.staleShiftsClosed} เวร | ลบ ${lastReport.dutyLogsPurged} บันทึก`
                  : 'พร้อมทำงานรอบถัดไป'
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-lg border border-purple-100">
            <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">กลไกความปลอดภัย</div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> ป้องกันฐานข้อมูลบวม
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Auto-Cleanup Switch */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900 m-0">เปิดใช้งานระบบจัดการฐานข้อมูลอัตโนมัติ (Master Switch)</h4>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            เมื่อเปิดใช้งาน Rust Backend Daemon จะทำการตรวจสอบและจัดระเบียบฐานข้อมูลเบื้องหลังทุก 15 นาที
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.autoEnabled}
            onChange={(e) => setForm({ ...form, autoEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {/* 3. Detailed Policies Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy 1: Stale Shifts Auto Clock-Out */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 m-0">เคลียร์เวรค้าง / ลืมออกเวร</h4>
              </div>
              <input
                type="checkbox"
                checked={form.staleShiftEnabled}
                onChange={(e) => setForm({ ...form, staleShiftEnabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              สำหรับแพทย์ที่ปิดเกมหรือลืมกดออกเวร ระบบจะตัดออกเวรอัตโนมัติและจำกัดชั่วโมงเวรสูงสุดไว้ เพื่อไม่ให้เงินเดือนคำนวณผิดพลาด
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">ตัดออกเวรเมื่อเข้าเวรค้างเกิน:</span>
            <select
              value={form.staleShiftHours}
              onChange={(e) => setForm({ ...form, staleShiftHours: Number(e.target.value) })}
              disabled={!form.staleShiftEnabled}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 disabled:bg-slate-100"
            >
              <option value={4}>4 ชั่วโมง</option>
              <option value={6}>6 ชั่วโมง (แนะนำ)</option>
              <option value={8}>8 ชั่วโมง</option>
              <option value={12}>12 ชั่วโมง</option>
            </select>
          </div>
        </div>

        {/* Policy 2: Daily Queue Reset */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 m-0">รีเซ็ตคิวแพทย์ประจำวัน (เที่ยงคืน)</h4>
              </div>
              <input
                type="checkbox"
                checked={form.queueResetEnabled}
                onChange={(e) => setForm({ ...form, queueResetEnabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              ล้างสถานะพร้อมรับคิว และตัดรอบบันทึกชั่วโมงหมอรันคิวรอบวันทุก 00:00 น. เพื่อเริ่มรอบคิวใหม่ในวันถัดไปอย่างถูกต้อง
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">เวลารีเซ็ตอัตโนมัติ:</span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60 font-mono">
              00:00 น. (ทุกเที่ยงคืน)
            </span>
          </div>
        </div>

        {/* Policy 3: Duty Logs Retention */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 m-0">ลบประวัติเวรเก่า (Duty Logs Purge)</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              ลบข้อมูลบันทึกเวลาเข้า-ออกเวรที่เสร็จสิ้นแล้วและผ่านการคำนวณเงินเดือนไปแล้ว เพื่อรักษาความเร็วของฐานข้อมูล
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">เก็บบันทึกย้อนหลังไว้:</span>
            <select
              value={form.dutyRetentionDays}
              onChange={(e) => setForm({ ...form, dutyRetentionDays: Number(e.target.value) })}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
            >
              <option value={30}>30 วัน (1 เดือน)</option>
              <option value={60}>60 วัน (2 เดือน - แนะนำ)</option>
              <option value={90}>90 วัน (3 เดือน)</option>
              <option value={180}>180 วัน (6 เดือน)</option>
              <option value={0}>ไม่ลบเลย (เก็บตลอดไป)</option>
            </select>
          </div>
        </div>

        {/* Policy 4: Leaves & Audits Retention */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 m-0">ลบประวัติคำขอลางานและ Audit Logs เก่า</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              ลบคำขอลางานที่อนุมัติ/ปฏิเสธแล้ว และบันทึกประวัติการกระทำระบบ (Audit Trail) ที่เก่าเกินกำหนดเพื่อประหยัดพื้นที่
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">เก็บบันทึกย้อนหลังไว้:</span>
            <select
              value={form.leaveRetentionDays}
              onChange={(e) => setForm({ 
                ...form, 
                leaveRetentionDays: Number(e.target.value),
                auditRetentionDays: Number(e.target.value)
              })}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800"
            >
              <option value={30}>30 วัน (1 เดือน)</option>
              <option value={60}>60 วัน (2 เดือน)</option>
              <option value={90}>90 วัน (3 เดือน - แนะนำ)</option>
              <option value={180}>180 วัน (6 เดือน)</option>
              <option value={0}>ไม่ลบเลย (เก็บตลอดไป)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Zap size={14} className="text-purple-600" />
          <span>การตั้งค่าจะมีผลกับระบบเบื้องหลัง Rust Backend และทำงานตลอด 24 ชั่วโมง</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
        </button>
      </div>
    </div>
  );
}
