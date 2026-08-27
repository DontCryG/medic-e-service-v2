import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Filter, Calendar, Save, Trash2, Edit2, Plus, Clock, Users, History } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import SmartSelect from '../../../components/common/SmartSelect';
import Swal from 'sweetalert2';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function HistoryModal({ isOpen, onClose, isAdmin = false }: HistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'manager' | 'story' | 'summary'>('manager');
  const [managerLogs, setManagerLogs] = useState<any[]>([]);
  const [storyLogs, setStoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const factionOptions = [
    { value: '[ MD ] MEDIC', label: '[ MD ] MEDIC' },
    { value: '[ PL ] POLICE', label: '[ PL ] POLICE' },
    { value: '[ CG ] CHANG', label: '[ CG ] CHANG' },
    { value: '[ 1D ] ONEDAY', label: '[ 1D ] ONEDAY' },
    { value: '[ OBS ] OBSIDIAN', label: '[ OBS ] OBSIDIAN' },
    { value: '[ 777 ] JEDWAI', label: '[ 777 ] JEDWAI' },
    { value: '[ R ] REQUIEM', label: '[ R ] REQUIEM' },
    { value: '[ RJJ ] ROI JOOB', label: '[ RJJ ] ROI JOOB' },
    { value: '[ YAK ] YAKUZA', label: '[ YAK ] YAKUZA' },
    { value: '[ MFYL ] MEFANYUNG LADY', label: '[ MFYL ] MEFANYUNG LADY' },
    { value: '[ SU ] STEPUP', label: '[ SU ] STEPUP' },
    { value: '[ MRD ] MAIRAKDEE', label: '[ MRD ] MAIRAKDEE' },
    { value: '[ B ] BARBARIAN', label: '[ B ] BARBARIAN' }
  ];

  const storyTypeOptions = [
    { value: 'ไฟต์ตรง (1 คน)', label: 'ไฟต์ตรง (1 คน)' },
    { value: 'ไฟต์ตรง (2 คน)', label: 'ไฟต์ตรง (2 คน)' },
    { value: 'รับของ (1 คน)', label: 'รับของ (1 คน)' },
    { value: 'รับของ (2 คน)', label: 'รับของ (2 คน)' },
  ];

  
  const handleSetDefaultDates = (tab: 'manager' | 'story' | 'summary') => {
    if (tab === 'manager' || tab === 'story') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      setStartDate(start);
      setEndDate(end);
    } else if (tab === 'summary') {
      const curr = new Date();
      const day = curr.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
      
      const start = new Date(new Date().setDate(diffToMonday));
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      setStartDate(start);
      setEndDate(end);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleSetDefaultDates(activeTab);
    }
  }, [isOpen, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let managerQuery = supabase.from('queue_manager_logs').select(`*, users (ic_name)`).order('start_time', { ascending: false });
      let storyQuery = supabase.from('story_logs').select(`*, users (ic_name)`).order('start_time', { ascending: false });

      if (startDate && endDate) {
        managerQuery = managerQuery.gte('start_time', startDate.toISOString()).lte('start_time', endDate.toISOString());
        storyQuery = storyQuery.gte('start_time', startDate.toISOString()).lte('start_time', endDate.toISOString());
      } else {
        managerQuery = managerQuery.limit(100);
        storyQuery = storyQuery.limit(100);
      }

      if (activeTab === 'manager' || activeTab === 'summary') {
        const { data, error } = await managerQuery;
        if (error) throw error;
        setManagerLogs(data || []);
      }

      if (activeTab === 'story' || activeTab === 'summary') {
        const { data, error } = await storyQuery;
        if (error) throw error;
        setStoryLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab, startDate, endDate]);

  useEffect(() => {
    if (isAdmin && activeTab === 'story' && allDoctors.length === 0) {
      supabase.from('users').select('discord_id, ic_name').neq('role', 'user').then(({ data }) => {
        if (data) setAllDoctors(data);
      });
    }
  }, [isAdmin, activeTab, allDoctors.length]);

  const summaryData = useMemo(() => {
    const summaryMap: Record<string, any> = {};
    managerLogs.forEach(log => {
      const did = log.discord_id;
      if (!summaryMap[did]) {
        summaryMap[did] = { ic_name: log.users?.ic_name || 'Unknown', total_manager_mins: 0, daily_manager_mins: {}, total_stories: 0 };
      }
      const duration = log.end_time ? (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000 : 0;
      summaryMap[did].total_manager_mins += duration;
      const dateKey = new Date(log.start_time).toLocaleDateString('en-GB');
      summaryMap[did].daily_manager_mins[dateKey] = (summaryMap[did].daily_manager_mins[dateKey] || 0) + duration;
    });

    storyLogs.forEach(log => {
      const did = log.discord_id;
      if (!summaryMap[did]) {
        summaryMap[did] = { ic_name: log.users?.ic_name || 'Unknown', total_manager_mins: 0, daily_manager_mins: {}, total_stories: 0 };
      }
      summaryMap[did].total_stories += 1;
    });

    return Object.values(summaryMap).map(data => {
      let bonusDays = 0;
      if (data.daily_manager_mins) {
        Object.values(data.daily_manager_mins).forEach((mins: any) => {
          if (mins >= 120) bonusDays++;
        });
      }
      return { ...data, bonusDays };
    }).sort((a, b) => b.total_manager_mins - a.total_manager_mins);
  }, [managerLogs, storyLogs]);

  const groupedManagerLogs = useMemo(() => {
    const groups: Record<string, any> = {};
    managerLogs.forEach(log => {
      const dateStr = new Date(log.start_time).toLocaleDateString('th-TH');
      const did = log.discord_id;
      const key = `${dateStr}_${did}`;
      if (!groups[key]) {
        groups[key] = { id: key, dateStr, ic_name: log.users?.ic_name, first_start: log.start_time, last_end: log.end_time || log.start_time, total_mins: 0, timestamp_for_sort: new Date(log.start_time).getTime() };
      }
      const duration = log.end_time ? (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000 : 0;
      groups[key].total_mins += duration;
      if (new Date(log.start_time) < new Date(groups[key].first_start)) groups[key].first_start = log.start_time;
      if (log.end_time && new Date(log.end_time) > new Date(groups[key].last_end)) groups[key].last_end = log.end_time;
    });
    return Object.values(groups).sort((a: any, b: any) => b.timestamp_for_sort - a.timestamp_for_sort);
  }, [managerLogs]);

  const handleClearFilters = () => { setStartDate(null); setEndDate(null); };
  const handleTodayFilter = () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    setStartDate(start); setEndDate(end);
  };

  const handleAddStory = () => {
    setEditForm({ discord_id: '', doctorSearchText: '', start_time: new Date().toISOString().slice(0, 16), gang_1: '', gang_2: '', story_type: 'ไฟต์ตรง (1 คน)' });
    setIsAdding(true); setEditingId(null);
  };

  const handleEditStory = (log: any) => {
    setEditForm({ discord_id: log.discord_id, doctorSearchText: log.users?.ic_name, start_time: new Date(log.start_time).toISOString().slice(0, 16), gang_1: log.gang_1, gang_2: log.gang_2, story_type: log.story_type });
    setEditingId(log.id); setIsAdding(false);
  };

  const cancelEdit = () => { setEditingId(null); setIsAdding(false); setEditForm({}); };

  const handleDeleteStory = async (id: string) => {
    const res = await Swal.fire({ title: 'ยืนยันการลบ?', text: 'คุณต้องการลบประวัติสตอรี่นี้ใช่หรือไม่?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' });
    if (res.isConfirmed) {
      await supabase.from('story_logs').delete().eq('id', id);
      fetchLogs();
    }
  };

  const handleSaveStory = async () => {
    if (!editForm.discord_id || !editForm.start_time) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณาเลือกชื่อหมอและเวลา', 'error'); return;
    }
    const payload = { discord_id: editForm.discord_id, gang_1: editForm.gang_1 || null, gang_2: editForm.gang_2 || null, story_type: editForm.story_type, start_time: new Date(editForm.start_time).toISOString() };
    if (isAdding) { await supabase.from('story_logs').insert([payload]); } 
    else if (editingId) { await supabase.from('story_logs').update(payload).eq('id', editingId); }
    setIsAdding(false); setEditingId(null); fetchLogs();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 m-0">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><History size={20} /></div>
            ประวัติระบบคิว & รายงาน
          </h2>
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4">
            
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto shadow-inner">
              <button 
                className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "manager" ? "bg-white text-blue-600 shadow-sm border-none" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border-none bg-transparent"}`}
                onClick={() => setActiveTab('manager')}
              >
                <Users size={16} /> ประวัติหมอรับคิว
              </button>
              <button 
                className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "story" ? "bg-white text-purple-600 shadow-sm border-none" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border-none bg-transparent"}`}
                onClick={() => setActiveTab('story')}
              >
                <Clock size={16} /> ประวัติสตอรี่
              </button>
              <button 
                className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "summary" ? "bg-white text-emerald-600 shadow-sm border-none" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border-none bg-transparent"}`}
                onClick={() => setActiveTab('summary')}
              >
                <Calendar size={16} /> สรุปรายงาน
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm w-full sm:w-auto">
                <Filter size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-600 shrink-0 mr-1">ตั้งแต่:</span>
                <DatePicker selected={startDate} onChange={setStartDate} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd/MM/yyyy" placeholderText="เริ่มต้น" className="w-[80px] sm:w-[100px] outline-none text-sm font-medium text-slate-700 bg-transparent" />
                <span className="text-sm font-medium text-slate-600 shrink-0 mx-1">ถึง:</span>
                <DatePicker selected={endDate} onChange={setEndDate} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || undefined} dateFormat="dd/MM/yyyy" placeholderText="สิ้นสุด" className="w-[80px] sm:w-[100px] outline-none text-sm font-medium text-slate-700 bg-transparent" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={handleTodayFilter} className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl border-none text-sm font-bold transition-colors whitespace-nowrap">วันนี้</button>
                <button onClick={handleClearFilters} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shadow-sm">ดูทั้งหมด</button>
              </div>
              {isAdmin && activeTab === 'story' && (
                <button onClick={handleAddStory} className="ml-auto w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-sm shadow-md border-none transition-colors whitespace-nowrap hover:-translate-y-0.5 active:translate-y-0">
                  <Plus size={16} strokeWidth={3} /> เพิ่มประวัติย้อนหลัง
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-emerald-500 gap-3">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <span className="font-bold">กำลังโหลดข้อมูล...</span>
            </div>
          ) : activeTab === 'summary' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">ชื่อแพทย์</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">เวลารับคิวสะสม</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">เข้าสตอรี่</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">โบนัสเวลา (จำนวนวัน)</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.length > 0 ? summaryData.map((data: any, idx: number) => {
                  const hours = Math.floor(data.total_manager_mins / 60);
                  const mins = Math.floor(data.total_manager_mins % 60);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-800 font-medium">{data.ic_name}</td>
                      <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-600">{hours > 0 ? `${hours} ชม. ` : ''}{mins} นาที</td>
                      <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-600">{data.total_stories > 0 ? `${data.total_stories} เคส` : '-'}</td>
                      <td className={`p-4 border-b border-slate-100 text-[0.95rem] font-bold ${data.bonusDays > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {data.bonusDays > 0 ? `${data.bonusDays} วัน (+${data.bonusDays * 2} ชม.)` : '-'}
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-medium text-lg">ไม่มีข้อมูลรายงานในช่วงเวลานี้</td></tr>}
              </tbody>
            </table>
          ) : activeTab === 'manager' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">วันที่</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">หมอรับคิว</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">รวมเวลา (นาที)</th>
                </tr>
              </thead>
              <tbody>
                {groupedManagerLogs.length > 0 ? groupedManagerLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-600">{log.dateStr}</td>
                    <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-800 font-medium">{log.ic_name}</td>
                    <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-600">{Math.round(log.total_mins)}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="p-16 text-center text-slate-400 font-medium text-lg">ไม่มีข้อมูลหมอรับคิวในช่วงเวลานี้</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">วันที่-เวลา</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">ชื่อหมอ</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">แก๊ง</th>
                  <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10">รูปแบบ</th>
                  {isAdmin && <th className="sticky top-0 bg-slate-50 p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 z-10 text-center">จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {(isAdding || storyLogs.length > 0) ? (
                  <>
                    {isAdding && (
                      <tr className="bg-purple-50/50">
                        <td className="p-4 border-b border-slate-100">
                           <SmartDatePicker selected={editForm.start_time ? new Date(editForm.start_time) : new Date()} onChange={(date: Date | null) => { if (date) { const oldDate = editForm.start_time ? new Date(editForm.start_time) : new Date(); date.setHours(oldDate.getHours(), oldDate.getMinutes()); const offset = date.getTimezoneOffset() * 60000; const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16); setEditForm({...editForm, start_time: localISOTime}); } }} dateFormat="dd/MM/yyyy" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 text-sm" placeholderText="วันที่" />
                           <input type="time" value={editForm.start_time ? new Date(editForm.start_time).toTimeString().slice(0, 5) : ''} onChange={(e) => { const timeStr = e.target.value; if (timeStr) { const [hh, mm] = timeStr.split(':'); const date = editForm.start_time ? new Date(editForm.start_time) : new Date(); date.setHours(parseInt(hh, 10), parseInt(mm, 10)); const offset = date.getTimezoneOffset() * 60000; const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16); setEditForm({...editForm, start_time: localISOTime}); } }} className="w-full mt-2 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 text-sm" />
                        </td>
                        <td className="p-4 border-b border-slate-100 relative">
                          <input type="text" value={editForm.doctorSearchText ?? ''} onChange={(e) => { setEditForm({...editForm, doctorSearchText: e.target.value, discord_id: ''}); setShowDoctorDropdown(true); }} onFocus={() => setShowDoctorDropdown(true)} onBlur={() => setTimeout(() => setShowDoctorDropdown(false), 200)} placeholder="ค้นหาชื่อแพทย์..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 text-sm" />
                          {showDoctorDropdown && allDoctors.length > 0 && (
                            <div className="absolute top-[100%] left-4 right-4 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                              {allDoctors.filter(d => d.ic_name.toLowerCase().includes((editForm.doctorSearchText || '').toLowerCase())).map(d => (
                                <div key={d.discord_id} onMouseDown={(e) => { e.preventDefault(); setEditForm({ ...editForm, discord_id: d.discord_id, doctorSearchText: d.ic_name }); setShowDoctorDropdown(false); }} className="px-4 py-2 cursor-pointer hover:bg-slate-50 text-sm border-b border-slate-50">{d.ic_name}</div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-[140px]"><SmartSelect options={factionOptions.filter(opt => opt.value !== editForm.gang_2)} value={editForm.gang_1 || ''} onChange={(val) => setEditForm({...editForm, gang_1: val})} searchable placeholder="- แก๊ง 1 -" /></div>
                            <span className="text-slate-400 text-xs font-bold uppercase">vs</span>
                            <div className="w-[140px]"><SmartSelect options={factionOptions.filter(opt => opt.value !== editForm.gang_1)} value={editForm.gang_2 || ''} onChange={(val) => setEditForm({...editForm, gang_2: val})} searchable placeholder="- แก๊ง 2 -" /></div>
                          </div>
                        </td>
                        <td className="p-4 border-b border-slate-100">
                          <div className="w-[160px]"><SmartSelect options={storyTypeOptions} value={editForm.story_type} onChange={(val) => setEditForm({...editForm, story_type: val})} /></div>
                        </td>
                        <td className="p-4 border-b border-slate-100 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={handleSaveStory} className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border-none"><Save size={16} /></button>
                            <button onClick={cancelEdit} className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border-none"><X size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {storyLogs.map(log => {
                      const isEd = editingId === log.id;
                      return (
                        <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${isEd ? 'bg-purple-50/50' : ''}`}>
                          <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-600">
                            {isEd ? (
                               <>
                                 <SmartDatePicker selected={editForm.start_time ? new Date(editForm.start_time) : new Date()} onChange={(date: Date | null) => { if (date) { const oldDate = editForm.start_time ? new Date(editForm.start_time) : new Date(); date.setHours(oldDate.getHours(), oldDate.getMinutes()); const offset = date.getTimezoneOffset() * 60000; const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16); setEditForm({...editForm, start_time: localISOTime}); } }} dateFormat="dd/MM/yyyy" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 text-sm" placeholderText="วันที่" />
                                 <input type="time" value={editForm.start_time ? new Date(editForm.start_time).toTimeString().slice(0, 5) : ''} onChange={(e) => { const timeStr = e.target.value; if (timeStr) { const [hh, mm] = timeStr.split(':'); const date = editForm.start_time ? new Date(editForm.start_time) : new Date(); date.setHours(parseInt(hh, 10), parseInt(mm, 10)); const offset = date.getTimezoneOffset() * 60000; const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16); setEditForm({...editForm, start_time: localISOTime}); } }} className="w-full mt-2 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 text-sm" />
                               </>
                            ) : new Date(log.start_time).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-800 font-medium relative">
                            {isEd ? (
                               <>
                                 <input type="text" value={editForm.doctorSearchText ?? ''} onChange={(e) => { setEditForm({...editForm, doctorSearchText: e.target.value, discord_id: ''}); setShowDoctorDropdown(true); }} onFocus={() => setShowDoctorDropdown(true)} onBlur={() => setTimeout(() => setShowDoctorDropdown(false), 200)} placeholder="ค้นหาชื่อแพทย์..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500 text-sm" />
                                 {showDoctorDropdown && allDoctors.length > 0 && (
                                   <div className="absolute top-[100%] left-4 right-4 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                     {allDoctors.filter(d => d.ic_name.toLowerCase().includes((editForm.doctorSearchText || '').toLowerCase())).map(d => (
                                       <div key={d.discord_id} onMouseDown={(e) => { e.preventDefault(); setEditForm({ ...editForm, discord_id: d.discord_id, doctorSearchText: d.ic_name }); setShowDoctorDropdown(false); }} className="px-4 py-2 cursor-pointer hover:bg-slate-50 text-sm border-b border-slate-50">{d.ic_name}</div>
                                     ))}
                                   </div>
                                 )}
                               </>
                            ) : log.users?.ic_name}
                          </td>
                          <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-600">
                             {isEd ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-[140px]"><SmartSelect options={factionOptions.filter(opt => opt.value !== editForm.gang_2)} value={editForm.gang_1 || ''} onChange={(val) => setEditForm({...editForm, gang_1: val})} searchable placeholder="- แก๊ง 1 -" /></div>
                                  <span className="text-slate-400 text-xs font-bold uppercase">vs</span>
                                  <div className="w-[140px]"><SmartSelect options={factionOptions.filter(opt => opt.value !== editForm.gang_1)} value={editForm.gang_2 || ''} onChange={(val) => setEditForm({...editForm, gang_2: val})} searchable placeholder="- แก๊ง 2 -" /></div>
                                </div>
                             ) : (
                                <div className="flex items-center gap-2">
                                  {log.gang_1 ? <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-lg text-xs">{log.gang_1}</span> : '-'}
                                  <span className="text-slate-400 text-xs font-bold uppercase">vs</span>
                                  {log.gang_2 ? <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-lg text-xs">{log.gang_2}</span> : '-'}
                                </div>
                             )}
                          </td>
                          <td className="p-4 border-b border-slate-100 text-[0.95rem] text-slate-600">
                             {isEd ? (
                                <div className="w-[160px]"><SmartSelect options={storyTypeOptions} value={editForm.story_type} onChange={(val) => setEditForm({...editForm, story_type: val})} /></div>
                             ) : log.story_type}
                          </td>
                          {isAdmin && (
                            <td className="p-4 border-b border-slate-100 text-center">
                              {isEd ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={handleSaveStory} className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border-none"><Save size={16} /></button>
                                  <button onClick={cancelEdit} className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border-none"><X size={16} /></button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleEditStory(log)} className="p-2 bg-slate-100 text-slate-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border-none"><Edit2 size={16} /></button>
                                  <button onClick={() => handleDeleteStory(log.id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border-none"><Trash2 size={16} /></button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  <tr><td colSpan={isAdmin ? 5 : 4} className="p-16 text-center text-slate-400 font-medium text-lg">ไม่มีข้อมูลประวัติสตอรี่ในช่วงเวลานี้</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
