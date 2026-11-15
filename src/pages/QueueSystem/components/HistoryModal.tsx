import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Filter, Calendar, Users, History } from 'lucide-react';
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
        .select(`*, users (ic_name)`)
        .order('start_time', { ascending: false });

      if (startDate && endDate) {
        managerQuery = managerQuery
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());
      } else {
        managerQuery = managerQuery.limit(100);
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
          ic_name: log.users?.ic_name || 'Unknown', 
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
      return { ...data, bonusDays };
    }).sort((a, b) => b.total_manager_mins - a.total_manager_mins);
  }, [managerLogs]);

  const groupedManagerLogs = useMemo(() => {
    const groups: Record<string, any> = {};
    managerLogs.forEach(log => {
      const dateStr = new Date(log.start_time).toLocaleDateString('th-TH');
      const did = log.discord_id;
      const key = `${dateStr}_${did}`;
      if (!groups[key]) {
        groups[key] = { 
          id: key, 
          dateStr, 
          ic_name: log.users?.ic_name, 
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200/90 animate-in zoom-in-98 duration-150" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
              <History size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 m-0">
              ประวัติระบบคิว & รายงานผู้จัดการคิว
            </h2>
          </div>
          <button 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer" 
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-slate-50/70 border-b border-slate-200/80 p-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Tabs */}
            <div className="flex bg-slate-200/60 p-0.5 rounded-lg w-fit">
              <button 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-none cursor-pointer ${
                  activeTab === "manager" 
                    ? "bg-white text-purple-700 shadow-2xs font-bold" 
                    : "text-slate-500 hover:text-slate-800 bg-transparent"
                }`}
                onClick={() => setActiveTab('manager')}
              >
                <Users size={14} /> 
                <span>ประวัติผู้จัดการคิว</span>
              </button>
              <button 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-none cursor-pointer ${
                  activeTab === "summary" 
                    ? "bg-white text-emerald-700 shadow-2xs font-bold" 
                    : "text-slate-500 hover:text-slate-800 bg-transparent"
                }`}
                onClick={() => setActiveTab('summary')}
              >
                <Calendar size={14} /> 
                <span>สรุปเวลา & โบนัส</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-lg px-2.5 py-1 shadow-2xs">
                <Filter size={13} className="text-slate-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-500">ตั้งแต่:</span>
                <DatePicker 
                  selected={startDate} 
                  onChange={setStartDate} 
                  selectsStart 
                  startDate={startDate} 
                  endDate={endDate} 
                  dateFormat="dd/MM/yyyy" 
                  placeholderText="เริ่มต้น" 
                  className="w-[75px] outline-none text-xs font-medium text-slate-800 bg-transparent" 
                />
                <span className="text-[11px] font-medium text-slate-400">ถึง:</span>
                <DatePicker 
                  selected={endDate} 
                  onChange={setEndDate} 
                  selectsEnd 
                  startDate={startDate} 
                  endDate={endDate} 
                  minDate={startDate || undefined} 
                  dateFormat="dd/MM/yyyy" 
                  placeholderText="สิ้นสุด" 
                  className="w-[75px] outline-none text-xs font-medium text-slate-800 bg-transparent" 
                />
              </div>

              <button 
                onClick={handleTodayFilter} 
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-purple-700 border border-purple-200/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                วันนี้
              </button>
              <button 
                onClick={handleClearFilters} 
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                ทั้งหมด
              </button>
            </div>

          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-purple-600 gap-2">
              <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : activeTab === 'summary' ? (
            <div className="rounded-xl border border-slate-200/80 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-4 py-2.5 font-bold text-slate-600">ชื่อแพทย์</th>
                    <th className="px-4 py-2.5 font-bold text-slate-600">เวลารับคิวสะสม</th>
                    <th className="px-4 py-2.5 font-bold text-slate-600">โบนัสเวลา (จำนวนวัน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryData.length > 0 ? summaryData.map((data: any, idx: number) => {
                    const hours = Math.floor(data.total_manager_mins / 60);
                    const mins = Math.floor(data.total_manager_mins % 60);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{data.ic_name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{hours > 0 ? `${hours} ชม. ` : ''}{mins} นาที</td>
                        <td className="px-4 py-2.5">
                          {data.bonusDays > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              {data.bonusDays} วัน (+{data.bonusDays * 2} ชม.)
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-slate-400 font-medium">
                        ไม่มีข้อมูลรายงานในช่วงเวลานี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-4 py-2.5 font-bold text-slate-600">วันที่</th>
                    <th className="px-4 py-2.5 font-bold text-slate-600">แพทย์ผู้รับคิว</th>
                    <th className="px-4 py-2.5 font-bold text-slate-600">รวมเวลา (นาที)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedManagerLogs.length > 0 ? groupedManagerLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 text-slate-600 font-medium">{log.dateStr}</td>
                      <td className="px-4 py-2.5 text-slate-800 font-semibold">{log.ic_name}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-mono font-medium">{Math.round(log.total_mins)} นาที</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-slate-400 font-medium">
                        ไม่มีข้อมูลแพทย์รับคิวในช่วงเวลานี้
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
