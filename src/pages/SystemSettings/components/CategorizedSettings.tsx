import { useState, useMemo, useEffect } from 'react';
import { 
  SETTING_DEFINITIONS, 
  useAppConfig, 
  type SettingDefinition 
} from '@/hooks/useAppConfig';
import { useSaveSystemSetting, useDeleteSystemSetting } from '../hooks/useSystemSettings';
import { 
  Building2, 
  Clock, 
  CalendarDays, 
  DollarSign, 
  Gift, 
  Settings2, 
  Search, 
  Save, 
  RotateCcw, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  HelpCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { showSuccessAlert, showErrorAlert, showConfirmDialog } from '@/utils/alert';

type CategoryFilter = 'all' | 'org' | 'queue' | 'leave' | 'pricing' | 'salary' | 'custom';

export default function CategorizedSettings() {
  const { config, rawSettings, isLoading, refetch } = useAppConfig();
  const saveMutation = useSaveSystemSetting();
  const deleteMutation = useDeleteSystemSetting();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for all fields so user can type freely
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  // New Custom Setting Modal state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');
  const [newCustomType, setNewCustomType] = useState<'number' | 'text'>('text');

  // Sync initial values from rawSettings / defaults
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const def of SETTING_DEFINITIONS) {
      const dbRow = rawSettings.find((r: any) => r.key === def.key);
      initial[def.key] = dbRow ? String(dbRow.value) : def.defaultValue;
    }
    // Also include custom settings that are in DB but not in catalog
    for (const r of rawSettings) {
      if (!initial[r.key] && r.key !== 'maintenance_mode') {
        initial[r.key] = String(r.value);
      }
    }
    setFormValues(initial);
  }, [rawSettings]);

  // Identify any custom keys in DB
  const customSettings = useMemo(() => {
    return rawSettings
      .filter((r: any) => !SETTING_DEFINITIONS.some(d => d.key === r.key) && r.key !== 'maintenance_mode')
      .map((r: any) => ({
        key: r.key,
        label: r.description || r.key,
        category: 'custom' as const,
        categoryLabel: 'การตั้งค่ากำหนดเอง',
        description: r.description || 'ค่ากำหนดเองในระบบ (Custom Key)',
        example: String(r.value),
        type: (r.type as any) || 'text',
        defaultValue: ''
      }));
  }, [rawSettings]);

  // Combined list of all items
  const allDefinitions = useMemo(() => {
    return [...SETTING_DEFINITIONS, ...customSettings];
  }, [customSettings]);

  // Filtered items based on Category and Search
  const filteredDefinitions = useMemo(() => {
    return allDefinitions.filter(def => {
      // Category filter
      if (activeCategory !== 'all' && def.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesKey = def.key.toLowerCase().includes(query);
        const matchesLabel = def.label.toLowerCase().includes(query);
        const matchesDesc = def.description.toLowerCase().includes(query);
        return matchesKey || matchesLabel || matchesDesc;
      }
      return true;
    });
  }, [allDefinitions, activeCategory, searchTerm]);

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveItem = async (def: SettingDefinition | any) => {
    const val = formValues[def.key] !== undefined ? formValues[def.key] : def.defaultValue;
    try {
      await saveMutation.mutateAsync({
        key: def.key,
        value: val,
        description: def.label,
        type: def.type
      });
      setSavedKeys(prev => ({ ...prev, [def.key]: true }));
      setTimeout(() => {
        setSavedKeys(prev => ({ ...prev, [def.key]: false }));
      }, 2000);
      showSuccessAlert('บันทึกสำเร็จ!', `อัปเดตการตั้งค่า "${def.label}" แล้ว และข้อความที่เกี่ยวข้องในระบบจะเปลี่ยนทันที`);
    } catch (err: any) {
      showErrorAlert('บันทึกไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleResetToDefault = (def: SettingDefinition) => {
    setFormValues(prev => ({ ...prev, [def.key]: def.defaultValue }));
  };

  const handleDeleteCustom = async (key: string) => {
    const confirm = await showConfirmDialog({
      title: 'ลบการตั้งค่านี้?',
      text: `คุณต้องการลบ Key: "${key}" ออกจากฐานข้อมูลใช่หรือไม่`,
      icon: 'warning',
      confirmButtonColor: '#ef4444'
    });
    if (confirm.isConfirmed) {
      await deleteMutation.mutateAsync(key);
      showSuccessAlert('ลบสำเร็จ', `ลบการตั้งค่า ${key} เรียบร้อยแล้ว`);
    }
  };

  const handleSaveAll = async () => {
    try {
      const promises = filteredDefinitions.map(def => {
        const val = formValues[def.key] !== undefined ? formValues[def.key] : def.defaultValue;
        return saveMutation.mutateAsync({
          key: def.key,
          value: val,
          description: def.label,
          type: def.type
        });
      });
      await Promise.all(promises);
      showSuccessAlert('บันทึกทั้งหมดสำเร็จ!', `อัปเดตการตั้งค่าจำนวน ${filteredDefinitions.length} รายการเรียบร้อยแล้ว`);
    } catch (err: any) {
      showErrorAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกข้อมูลทั้งหมดได้');
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomKey.trim()) return;
    try {
      await saveMutation.mutateAsync({
        key: newCustomKey.trim().toLowerCase().replace(/\\s+/g, '_'),
        value: newCustomValue,
        description: newCustomLabel.trim() || newCustomKey.trim(),
        type: newCustomType
      });
      setIsAddingCustom(false);
      setNewCustomKey('');
      setNewCustomLabel('');
      setNewCustomValue('');
      showSuccessAlert('เพิ่มสำเร็จ!', `เพิ่มการตั้งค่ากำหนดเอง "${newCustomKey}" เรียบร้อย`);
    } catch (err: any) {
      showErrorAlert('ผิดพลาด', err.message || 'ไม่สามารถเพิ่มการตั้งค่าได้');
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allDefinitions.length };
    for (const def of allDefinitions) {
      counts[def.category] = (counts[def.category] || 0) + 1;
    }
    return counts;
  }, [allDefinitions]);

  return (
    <div className="flex flex-col gap-5">
      
      {/* Top Banner / Explanation */}
      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-purple-950 m-0">
              ศูนย์กลางการตั้งค่าระบบและนโยบายหน่วยงานแพทย์ (Dynamic Policy Engine)
            </h3>
            <p className="text-[11px] text-purple-800 m-0 mt-0.5 leading-relaxed font-normal">
              การปรับเปลี่ยนค่าในหน้านี้ จะมีผลกับข้อความแจ้งเตือน เกณฑ์การคำนวณเงินเดือน และระเบียบการใช้งานทั่วทั้งระบบทันทีโดยอัตโนมัติ
            </p>
          </div>
        </div>

        <button 
          onClick={handleSaveAll}
          disabled={saveMutation.isPending}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer border-none shrink-0"
        >
          <Save size={14} />
          <span>บันทึกที่แสดงทั้งหมด ({filteredDefinitions.length})</span>
        </button>
      </div>

      {/* Filter Toolbar: Category Tabs + Search Bar */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-100">
        
        {/* Row 1: Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
            }`}
          >
            <span>📌 ทั้งหมด ({categoryCounts.all || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('org')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === 'org'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
            }`}
          >
            <Building2 size={13} />
            <span>ข้อมูลองค์กร ({categoryCounts.org || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === 'queue'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
            }`}
          >
            <Clock size={13} />
            <span>ระบบคิว & เวลาเวร ({categoryCounts.queue || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('leave')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === 'leave'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
            }`}
          >
            <CalendarDays size={13} />
            <span>นโยบายการลา ({categoryCounts.leave || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('pricing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === 'pricing'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
            }`}
          >
            <DollarSign size={13} />
            <span>เรทราคาการรักษา ({categoryCounts.pricing || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('salary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === 'salary'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
            }`}
          >
            <Gift size={13} />
            <span>เงินเดือน & รางวัล ({categoryCounts.salary || 0})</span>
          </button>

          {categoryCounts.custom ? (
            <button
              type="button"
              onClick={() => setActiveCategory('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                activeCategory === 'custom'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-bold'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90'
              }`}
            >
              <Settings2 size={13} />
              <span>กำหนดเอง ({categoryCounts.custom})</span>
            </button>
          ) : null}
        </div>

        {/* Row 2: Search Bar & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          {/* Spacious Modern Search Input */}
          <div className="relative w-full sm:w-80 md:w-96">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              <Search size={15} />
            </div>
            <input 
              type="text"
              placeholder="ค้นหาชื่อการตั้งค่า คำอธิบาย หรือ Key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full !pl-10.5 pr-8 py-2 bg-slate-50/70 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors border-none bg-transparent cursor-pointer"
                title="ล้างข้อความค้นหา"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right Action: Result count badge & Add Custom button */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {searchTerm && (
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/70 px-2.5 py-1 rounded-lg">
                พบ {filteredDefinitions.length} รายการ
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsAddingCustom(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100/90 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
              title="เพิ่มการตั้งค่ากำหนดเอง"
            >
              <Plus size={14} className="text-purple-600" />
              <span>เพิ่ม Key กำหนดเอง</span>
            </button>
          </div>
        </div>

      </div>

      {/* Grid of Setting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDefinitions.map((def: any) => {
          const currentVal = formValues[def.key] !== undefined ? formValues[def.key] : def.defaultValue;
          const isSaved = savedKeys[def.key];
          const isDefault = currentVal === def.defaultValue;

          return (
            <div 
              key={def.key}
              className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all group"
            >
              <div>
                
                {/* Card Top: Category Badge & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                      {def.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      key: {def.key}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isDefault ? (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/60">
                        ค่าเริ่มต้น
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60">
                        ปรับแต่งแล้ว
                      </span>
                    )}

                    {def.category === 'custom' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(def.key)}
                        className="text-slate-400 hover:text-rose-600 p-1 border-none bg-transparent cursor-pointer rounded"
                        title="ลบ Key นี้"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-slate-900 m-0 mb-1">
                  {def.label}
                </h4>

                {/* Detailed Description */}
                <p className="text-[11px] text-slate-500 m-0 leading-relaxed font-normal mb-2.5">
                  {def.description}
                </p>

                {/* Example Hint */}
                {def.example && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50/90 border border-slate-200/60 rounded-md px-2.5 py-1 mb-3">
                    <HelpCircle size={11} className="text-purple-600 shrink-0" />
                    <span className="font-semibold text-slate-600">ตัวอย่างค่าที่แนะนำ:</span>
                    <span className="font-mono text-slate-800 font-bold">{def.example}</span>
                  </div>
                )}

              </div>

              {/* Card Bottom: Input & Save Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <div className="relative flex-1">
                  {def.type === 'number' ? (
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={currentVal}
                        onChange={(e) => handleChange(def.key, e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/90 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-500/10 transition-all font-mono"
                      />
                      {def.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                          {def.unit}
                        </span>
                      )}
                    </div>
                  ) : def.key.includes('notice') || def.description.length > 50 ? (
                    <textarea 
                      rows={2}
                      value={currentVal}
                      onChange={(e) => handleChange(def.key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-500/10 transition-all leading-relaxed"
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={currentVal}
                      onChange={(e) => handleChange(def.key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-500/10 transition-all"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {def.defaultValue !== undefined && !isDefault && (
                    <button
                      type="button"
                      onClick={() => handleResetToDefault(def)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition-colors cursor-pointer"
                      title="คืนค่าเป็นค่าเริ่มต้น"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSaveItem(def)}
                    disabled={saveMutation.isPending}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer border-none ${
                      isSaved 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isSaved ? <Check size={13} /> : <Save size={13} />}
                    <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredDefinitions.length === 0 && (
        <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <Settings2 size={36} className="mx-auto text-slate-300 mb-2 opacity-60" />
          <p className="text-xs font-bold text-slate-700 m-0">ไม่พบการตั้งค่าที่ตรงกับการค้นหา</p>
          <p className="text-[11px] text-slate-400 m-0 mt-0.5">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
        </div>
      )}

      {/* Add Custom Setting Modal */}
      {isAddingCustom && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-98 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                  <Plus size={15} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 m-0">เพิ่มการตั้งค่ากำหนดเอง (Custom Key)</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="p-5 flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key ภาษาอังกฤษ (ตัวพิมพ์เล็ก ไม่มีช่องว่าง) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="เช่น custom_hospital_fee"
                  value={newCustomKey}
                  onChange={(e) => setNewCustomKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อการตั้งค่าภาษาไทย / คำอธิบาย <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="เช่น ค่าธรรมเนียมพิเศษโรงพยาบาล"
                  value={newCustomLabel}
                  onChange={(e) => setNewCustomLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทข้อมูล
                  </label>
                  <select
                    value={newCustomType}
                    onChange={(e: any) => setNewCustomType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-purple-600 focus:bg-white"
                  >
                    <option value="text">ข้อความ (TEXT)</option>
                    <option value="number">ตัวเลข (NUMBER)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ค่าเริ่มต้น (Value) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type={newCustomType === 'number' ? 'number' : 'text'}
                    required
                    placeholder="เช่น 15000"
                    value={newCustomValue}
                    onChange={(e) => setNewCustomValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border-none"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer border-none shadow-2xs"
                >
                  บันทึก Key ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
