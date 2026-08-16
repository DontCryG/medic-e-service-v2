import { useState, useEffect, useMemo } from 'react';
import { X, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SmartDatePicker from '../../../components/common/SmartDatePicker';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'manager' | 'story' | 'summary'>('manager');
  const [managerLogs, setManagerLogs] = useState<any[]>([]);
  const [storyLogs, setStoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setHours(0, 0, 0, 0)));
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setHours(23, 59, 59, 999)));

  useEffect(() => {
    if (!isOpen) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        let managerQuery = supabase
          .from('queue_manager_logs')
          .select(`*, users (ic_name)`)
          .order('start_time', { ascending: false });

        let storyQuery = supabase
          .from('story_logs')
          .select(`*, users (ic_name)`)
          .order('start_time', { ascending: false });

        if (startDate && endDate) {
          const startIso = startDate.toISOString();
          const endIso = endDate.toISOString();
          managerQuery = managerQuery.gte('start_time', startIso).lte('start_time', endIso);
          storyQuery = storyQuery.gte('start_time', startIso).lte('start_time', endIso);
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
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isOpen, activeTab, startDate, endDate]);

  // Compute summary report
  const summaryData = useMemo(() => {
    const summaryMap: Record<string, any> = {};

    // Process manager logs
    managerLogs.forEach(log => {
      const did = log.discord_id;
      if (!summaryMap[did]) {
        summaryMap[did] = {
          ic_name: log.users?.ic_name || 'Unknown',
          total_manager_mins: 0,
          total_stories: 0,
          daily_manager_mins: {}
        };
      }
      summaryMap[did].total_manager_mins += log.duration_minutes || 0;
      
      // Keep track of daily duration for bonus calculation
      const dayKey = new Date(log.start_time).toLocaleDateString('th-TH');
      if (!summaryMap[did].daily_manager_mins) {
        summaryMap[did].daily_manager_mins = {};
      }
      summaryMap[did].daily_manager_mins[dayKey] = (summaryMap[did].daily_manager_mins[dayKey] || 0) + (log.duration_minutes || 0);
    });

    // Process story logs
    storyLogs.forEach(log => {
      const did = log.discord_id;
      if (!summaryMap[did]) {
        summaryMap[did] = {
          ic_name: log.users?.ic_name || 'Unknown',
          total_manager_mins: 0,
          total_stories: 0,
          daily_manager_mins: {}
        };
      }
      summaryMap[did].total_stories += 1;
    });

    // Calculate Bonus Days (Days where manager mins >= 120)
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

  // Group Manager Logs by Day and User
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
      } else {
        if (new Date(log.start_time) < new Date(groups[key].first_start)) {
          groups[key].first_start = log.start_time;
        }
        if (log.end_time && new Date(log.end_time) > new Date(groups[key].last_end)) {
          groups[key].last_end = log.end_time;
        }
      }
      groups[key].total_mins += (log.duration_minutes || 0);
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="queue-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ประวัติระบบคิว & รายงาน</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-switcher" style={{ paddingBottom: '12px' }}>
          <button 
            className={`switcher-btn ${activeTab === 'manager' ? 'active-blue' : 'inactive'}`}
            onClick={() => setActiveTab('manager')}
          >
            ประวัติหมอรันคิว
          </button>
          <button 
            className={`switcher-btn ${activeTab === 'story' ? 'active-purple' : 'inactive'}`}
            onClick={() => setActiveTab('story')}
          >
            ประวัติสตอรี่
          </button>
          <button 
            className={`switcher-btn ${activeTab === 'summary' ? 'active-green' : 'inactive'}`}
            onClick={() => setActiveTab('summary')}
            style={{ background: activeTab === 'summary' ? '#10b981' : undefined, color: activeTab === 'summary' ? 'white' : undefined }}
          >
            สรุปรายงาน
          </button>
        </div>

        {/* Date Filters */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          flexWrap: 'wrap', 
          padding: '0 24px 16px 24px',
          borderBottom: '1px solid var(--qs-border, #e2e8f0)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} color="#64748b" />
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>ตั้งแต่:</span>
            <SmartDatePicker 
              selected={startDate} 
              onChange={setStartDate} 
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="filter-input-small"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>ถึง:</span>
            <SmartDatePicker 
              selected={endDate} 
              onChange={setEndDate} 
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              className="filter-input-small"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleTodayFilter}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              วันนี้
            </button>
            <button 
              onClick={handleClearFilters}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              ดูทั้งหมด
            </button>
          </div>
        </div>

        <div className="history-list">
          {loading ? (
            <div className="loading-state">กำลังโหลดข้อมูล...</div>
          ) : activeTab === 'summary' ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>ชื่อแพทย์</th>
                  <th>เวลารันคิวสะสม</th>
                  <th>เข้าสตอรี่</th>
                  <th style={{ color: '#10b981' }}>โบนัสเวลา (จำนวนวัน)</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.length > 0 ? summaryData.map((data, idx) => {
                  const totalRoundedMins = Math.round(data.total_manager_mins);
                  const hours = Math.floor(totalRoundedMins / 60);
                  const mins = totalRoundedMins % 60;
                  return (
                    <tr key={idx}>
                      <td>{data.ic_name}</td>
                      <td>{hours > 0 ? `${hours} ชม. ` : ''}{mins} นาที</td>
                      <td>{data.total_stories > 0 ? `${data.total_stories} เคส` : '-'}</td>
                      <td style={{ fontWeight: data.bonusDays > 0 ? 'bold' : 'normal', color: data.bonusDays > 0 ? '#10b981' : 'inherit' }}>
                        {data.bonusDays > 0 ? `${data.bonusDays} วัน (+${data.bonusDays * 2} ชม.)` : '-'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="empty-state">ไม่มีข้อมูลในช่วงเวลาที่เลือก</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : activeTab === 'manager' ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>หมอรันคิว</th>
                  <th>รวมเวลา (นาที)</th>
                </tr>
              </thead>
              <tbody>
                {groupedManagerLogs.length > 0 ? groupedManagerLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.dateStr}</td>
                    <td>{log.ic_name}</td>
                    <td>{Math.round(log.total_mins)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="empty-state">ไม่มีประวัติหมอรันคิว</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ชื่อหมอ</th>
                  <th>แก๊ง</th>
                  <th>รูปแบบ</th>
                </tr>
              </thead>
              <tbody>
                {storyLogs.length > 0 ? storyLogs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.start_time).toLocaleDateString('th-TH')}</td>
                    <td>{log.users?.ic_name}</td>
                    <td>
                      {log.gang_1 && log.gang_2 ? `${log.gang_1} vs ${log.gang_2}` : '-'}
                    </td>
                    <td>{log.story_type}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="empty-state">ไม่มีประวัติสตอรี่</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
