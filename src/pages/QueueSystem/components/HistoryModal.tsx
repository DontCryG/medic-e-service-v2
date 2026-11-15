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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 m-0">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><History size={20} /></div>
            ประวัติระบบคิว & รายงานผู้จัดการคิว
          </h2>
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs & Filters */}
        <div className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4">
            
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto shadow-inner">
              <button 
                className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === "manager" ? "bg-white text-blue-600 shadow-sm border-none" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border-none bg-transparent"}`}
                onClick={() => setActiveTab('manager')}
              >
                <Users size={16} /> ประวัติผู้จัดการคิว
              </button>
              <button 
                className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === "summary" ? "bg-white text-emerald-600 shadow-sm border-none" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border-none bg-transparent"}`}
                onClick={() => setActiveTab('summary')}
              >
                <Calendar size={16} /> สรุปสถิติเวลา & โบนัส
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm w-full sm:w-auto">
                <Filter size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-600 shrink-0 mr-1">ตั้งแต่:</span>
                <DatePicker 
                  selected={startDate} 
                  onChange={setStartDate} 
                  selectsStart 
                  startDate={startDate} 
                  endDate={endDate} 
                  dateFormat="dd/MM/yyyy" 
                  placeholderText="เริ่มต้น" 
                  className="w-[80px] sm:w-[100px] outline-none text-sm font-medium text-slate-700 bg-transparent" 
                />
                <span className="text-sm font-medium text-slate-600 shrink-0 mx-1">ถึง:</span>
                <DatePicker 
                  selected={endDate} 
                  onChange={setEndDate} 
                  selectsEnd 
                  startDate={startDate} 
                  endDate={endDate} 
                  minDate={startDate || undefined} 
                  dateFormat="dd/MM/yyyy" 
                  placeholderText="สิ้นสุด" 
                  className="w-[80px] sm:w-[100px] outline-none text-sm font-medium text-slate-700 bg-transparent" 
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={handleTodayFilter} className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl border-none text-sm font-bold transition-colors whitespace-nowrap cursor-pointer">วันนี้</button>
                <button onClick={handleClearFilters} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shadow-sm cursor-pointer">ดูทั้งหมด</button>
              </div>
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
                      <td className={`p-4 border-b border-slate-100 text-[0.95rem] font-bold ${data.bonusDays > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {data.bonusDays > 0 ? `${data.bonusDays} วัน (+${data.bonusDays * 2} ชม.)` : '-'}
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={3} className="p-16 text-center text-slate-400 font-medium text-lg">ไม่มีข้อมูลรายงานในช่วงเวลานี้</td></tr>}
              </tbody>
            </table>
          ) : (
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
          )}
        </div>

      </div>
    </div>
  );
}
