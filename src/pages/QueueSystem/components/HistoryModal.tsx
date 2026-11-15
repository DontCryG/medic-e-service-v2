import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  Filter, 
  Calendar, 
  Users, 
  History, 
  Award, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Trophy, 
  ArrowRight,
  TrendingUp,
  Stethoscope
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'manager' | 'summary'>('manager');
  const [managerLogs, setManagerLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSetDefaultDates = (tab: 'manager' | 'summary') => {
    if (tab === 'manager') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
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
      let managerQuery = supabase
        .from('queue_manager_logs')
        .select(`*, users (ic_name, avatar_url)`)
        .order('start_time', { ascending: false });

      if (startDate && endDate) {
        managerQuery = managerQuery
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());
      } else {
        managerQuery = managerQuery.limit(150);
      }

      const { data, error } = await managerQuery;
      if (error) throw error;
      setManagerLogs(data || []);
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

  const summaryData = useMemo(() => {
    const summaryMap: Record<string, any> = {};
    managerLogs.forEach(log => {
      const did = log.discord_id;
      if (!summaryMap[did]) {
        summaryMap[did] = { 
          discord_id: did,
          ic_name: log.users?.ic_name || 'ไม่ระบุชื่อ', 
          avatar_url: log.users?.avatar_url || '',
          total_manager_mins: 0, 
          daily_manager_mins: {} 
        };
      }
      const duration = log.end_time 
        ? (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000 
        : 0;
      summaryMap[did].total_manager_mins += duration;
      const dateKey = new Date(log.start_time).toLocaleDateString('en-GB');
      summaryMap[did].daily_manager_mins[dateKey] = (summaryMap[did].daily_manager_mins[dateKey] || 0) + duration;
    });

    return Object.values(summaryMap).map(data => {
      let bonusDays = 0;
      if (data.daily_manager_mins) {
        Object.values(data.daily_manager_mins).forEach((mins: any) => {
          if (mins >= 120) bonusDays++;
        });
      }
      return { 
        ...data, 
        bonusDays, 
        bonusHours: bonusDays * 2 
      };
    }).sort((a, b) => b.total_manager_mins - a.total_manager_mins);
  }, [managerLogs]);

  const groupedManagerLogs = useMemo(() => {
    const groups: Record<string, any> = {};
    managerLogs.forEach(log => {
      const dateStr = new Date(log.start_time).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const did = log.discord_id;
      const key = `${dateStr}_${did}`;
      if (!groups[key]) {
        groups[key] = { 
          id: key, 
          dateStr, 
          rawDate: log.start_time,
          ic_name: log.users?.ic_name || 'ไม่ระบุชื่อ', 
          avatar_url: log.users?.avatar_url || '',
          first_start: log.start_time, 
          last_end: log.end_time || log.start_time, 
          total_mins: 0, 
          timestamp_for_sort: new Date(log.start_time).getTime() 
        };
      }
      const duration = log.end_time 
        ? (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000 
        : 0;
      groups[key].total_mins += duration;
      if (new Date(log.start_time) < new Date(groups[key].first_start)) groups[key].first_start = log.start_time;
      if (log.end_time && new Date(log.end_time) > new Date(groups[key].last_end)) groups[key].last_end = log.end_time;
    });
    return Object.values(groups).sort((a: any, b: any) => b.timestamp_for_sort - a.timestamp_for_sort);
  }, [managerLogs]);

  // Aggregate Metrics for Tab 2
  const totalMinsAll = useMemo(() => {
    return summaryData.reduce((acc, curr) => acc + (curr.total_manager_mins || 0), 0);
  }, [summaryData]);

  const totalBonusDaysAll = useMemo(() => {
    return summaryData.reduce((acc, curr) => acc + (curr.bonusDays || 0), 0);
  }, [summaryData]);

  const maxManagerMins = useMemo(() => {
    return summaryData.length > 0 ? summaryData[0].total_manager_mins : 1;
  }, [summaryData]);

  const handleClearFilters = () => { 
    setStartDate(null); 
    setEndDate(null); 
  };

  const handleTodayFilter = () => {
    const start = new Date(); 
    start.setHours(0, 0, 0, 0);
    const end = new Date(); 
    end.setHours(23, 59, 59, 999);
    setStartDate(start); 
    setEndDate(end);
  };

  const handleLast7DaysFilter = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    setStartDate(start);
    setEndDate(end);
  };

  const isTodayActive = useMemo(() => {
    if (!startDate || !endDate) return false;
    const today = new Date();
    return (
      startDate.getDate() === today.getDate() &&
      startDate.getMonth() === today.getMonth() &&
      startDate.getFullYear() === today.getFullYear() &&
      endDate.getDate() === today.getDate() &&
      endDate.getMonth() === today.getMonth() &&
      endDate.getFullYear() === today.getFullYear()
    );
  }, [startDate, endDate]);

  const isAllActive = useMemo(() => {
    return startDate === null && endDate === null;
  }, [startDate, endDate]);

  const formatDuration = (totalMins: number) => {
    const hours = Math.floor(totalMins / 60);
    const mins = Math.round(totalMins % 60);
    if (hours > 0 && mins > 0) {
      return `${hours} ชม. ${mins} นาที`;
    }
    if (hours > 0) {
      return `${hours} ชม.`;
    }
    return `${mins} นาที`;
  };

  const formatTimeOnly = (dateIso: string) => {
    if (!dateIso) return '-';
    try {
      const d = new Date(dateIso);
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    } catch {
      return '-';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-150" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/90 animate-in zoom-in-98 duration-150" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
              <History size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 m-0">
                  ประวัติระบบคิว & รายงานผู้จัดการคิว
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70">
                  {activeTab === 'manager' ? `${groupedManagerLogs.length} บันทึก` : `${summaryData.length} ท่าน`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium m-0 mt-0.5">
                Queue Manager Operations & Bonus Ledger • รายงานสถิติการรับหน้าที่คิวและโบนัสสะสม
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar: Segmented Tabs & Filters */}
        <div className="bg-slate-50/70 border-b border-slate-200/80 px-5 py-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Tabs */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl w-fit shrink-0">
              <button 
                type="button"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
                  activeTab === 'manager' 
                    ? 'bg-white text-purple-700 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
                onClick={() => setActiveTab('manager')}
              >
                <Users size={14} className={activeTab === 'manager' ? 'text-purple-600' : 'text-slate-400'} /> 
                <span>ประวัติผู้จัดการคิว</span>
              </button>
              <button 
                type="button"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
                  activeTab === 'summary' 
                    ? 'bg-white text-purple-700 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
                onClick={() => setActiveTab('summary')}
              >
                <Award size={14} className={activeTab === 'summary' ? 'text-purple-600' : 'text-slate-400'} /> 
                <span>สรุปเวลา & โบนัส</span>
              </button>
            </div>

            {/* Filter Group: Single Pill Date Range + Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1 shadow-2xs">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500">ตั้งแต่</span>
                <DatePicker 
                  selected={startDate} 
                  onChange={setStartDate} 
                  selectsStart 
                  startDate={startDate} 
                  endDate={endDate} 
                  dateFormat="dd/MM/yyyy" 
                  placeholderText="เริ่มต้น" 
                  wrapperClassName="w-[78px]"
                  className="w-[78px] outline-none text-xs font-semibold text-slate-800 bg-transparent text-center border-none p-0 cursor-pointer" 
                />
                <span className="text-slate-300 font-bold text-xs mx-0.5">→</span>
                <span className="text-[11px] font-semibold text-slate-500">ถึง</span>
                <DatePicker 
                  selected={endDate} 
                  onChange={setEndDate} 
                  selectsEnd 
                  startDate={startDate} 
                  endDate={endDate} 
                  minDate={startDate || undefined} 
                  dateFormat="dd/MM/yyyy" 
                  placeholderText="สิ้นสุด" 
                  wrapperClassName="w-[78px]"
                  className="w-[78px] outline-none text-xs font-semibold text-slate-800 bg-transparent text-center border-none p-0 cursor-pointer" 
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  type="button"
                  onClick={handleTodayFilter} 
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs border ${
                    isTodayActive 
                      ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold' 
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  วันนี้
                </button>
                <button 
                  type="button"
                  onClick={handleLast7DaysFilter} 
                  className="hidden sm:inline-flex px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  7 วันล่าสุด
                </button>
                <button 
                  type="button"
                  onClick={handleClearFilters} 
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs border ${
                    isAllActive
                      ? 'bg-slate-100 text-slate-800 border-slate-300 font-semibold'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ทั้งหมด
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#fafafa] p-4 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-56 text-purple-600 gap-3">
              <div className="w-7 h-7 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500">กำลังดึงข้อมูลประวัติระบบคิว...</span>
            </div>
          ) : activeTab === 'summary' ? (
            <div className="flex flex-col gap-4">
              
              {/* Executive Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-400">แพทย์ปฏิบัติหน้าที่คิว</div>
                    <div className="text-base font-extrabold text-slate-900">
                      {summaryData.length} <span className="text-xs font-normal text-slate-500">ท่าน</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                    <Clock size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-400">เวลารับคิวสะสมรวม</div>
                    <div className="text-base font-extrabold text-slate-900 truncate">
                      {formatDuration(totalMinsAll)}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                    <Award size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-400">โบนัสเวลาสะสมที่ได้รับ</div>
                    <div className="text-base font-extrabold text-emerald-700">
                      {totalBonusDaysAll} <span className="text-xs font-bold text-emerald-600">วัน</span>{' '}
                      <span className="text-xs font-medium text-slate-400">(+{totalBonusDaysAll * 2} ชม.)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonus Criteria Notice */}
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-900 font-medium">
                <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <p className="m-0 leading-relaxed text-[11px]">
                  <span className="font-bold text-purple-800">เกณฑ์การคำนวณโบนัสผู้จัดการคิว:</span>{' '}
                  แพทย์ที่ปฏิบัติหน้าที่รับคิวสะสมในแต่ละวันครบ <span className="font-bold underline text-purple-900">120 นาที (2 ชั่วโมง)</span> ขึ้นไป จะได้รับโบนัสเวลาเวรเพิ่ม <span className="font-bold text-emerald-700">+2 ชม. ต่อวัน</span> โดยอัตโนมัติ
                </p>
              </div>

              {/* Summary Table */}
              <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] w-14 text-center">
                        อันดับ
                      </th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                        แพทย์ผู้ปฏิบัติหน้าที่
                      </th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                        เวลารับคิวสะสม
                      </th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center">
                        จำนวนวันผ่านเกณฑ์ (≥120น.)
                      </th>
                      <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">
                        โบนัสเวลาที่ได้รับ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData.length > 0 ? summaryData.map((data: any, idx: number) => {
                      const percent = Math.min(100, Math.round((data.total_manager_mins / maxManagerMins) * 100));
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-center">
                            {idx === 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-xs">
                                <Trophy size={12} className="text-amber-600 mr-0.5" /> 1
                              </span>
                            ) : idx === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-300 text-xs">
                                2
                              </span>
                            ) : idx === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-300/80 text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs font-semibold">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {data.avatar_url ? (
                                <img 
                                  src={data.avatar_url} 
                                  alt={data.ic_name} 
                                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" 
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center text-xs font-bold shrink-0">
                                  {data.ic_name.charAt(0) || 'M'}
                                </div>
                              )}
                              <span className="font-bold text-slate-900">{data.ic_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-800">
                                {formatDuration(data.total_manager_mins)}
                              </div>
                              <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600 rounded-full" 
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-slate-800 text-xs">
                              {data.bonusDays} <span className="font-normal text-slate-400">วัน</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {data.bonusDays > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                <CheckCircle2 size={12} />
                                +{data.bonusHours} ชม.
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-16 text-center text-slate-400 font-medium">
                          <Users size={32} className="mx-auto mb-2 text-slate-300 opacity-60" />
                          <p className="m-0 text-xs font-bold text-slate-600">ไม่มีข้อมูลรายงานในช่วงเวลานี้</p>
                          <p className="m-0 text-[11px] text-slate-400 mt-0.5">ลองปรับตัวกรองช่วงวันที่หรือกดดูทั้งหมด</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      วันที่ปฏิบัติหน้าที่
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      แพทย์ผู้รับคิว
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      ช่วงเวลาที่รับคิว
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                      รวมเวลา (นาที)
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">
                      สถานะโบนัสประจำวัน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedManagerLogs.length > 0 ? groupedManagerLogs.map((log: any) => {
                    const hasBonus = log.total_mins >= 120;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                            <span className="font-semibold text-slate-800">{log.dateStr}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {log.avatar_url ? (
                              <img 
                                src={log.avatar_url} 
                                alt={log.ic_name} 
                                className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" 
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center text-xs font-bold shrink-0">
                                {log.ic_name.charAt(0) || 'M'}
                              </div>
                            )}
                            <span className="font-bold text-slate-900">{log.ic_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-500 font-mono text-xs">
                            {formatTimeOnly(log.first_start)} - {formatTimeOnly(log.last_end)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              {formatDuration(log.total_mins)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({Math.round(log.total_mins)} น.)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {hasBonus ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              <CheckCircle2 size={12} />
                              ผ่านเกณฑ์ (+2 ชม.)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80">
                              ขาดอีก {120 - Math.round(log.total_mins)} น.
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-slate-400 font-medium">
                        <Calendar size={32} className="mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="m-0 text-xs font-bold text-slate-600">ไม่มีข้อมูลแพทย์รับคิวในช่วงเวลานี้</p>
                        <p className="m-0 text-[11px] text-slate-400 mt-0.5">ลองปรับตัวกรองช่วงวันที่หรือกดดูทั้งหมด</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
