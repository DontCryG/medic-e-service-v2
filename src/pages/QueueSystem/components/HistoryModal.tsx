import { useState, useEffect, useMemo } from 'react';
import { X, Filter, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import { useQueueMutations } from '../hooks/useQueueMutations';
import { useGangs, useFamilies } from '../../SystemSettings/hooks/useGangsFamilies';

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

  // Date filters
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setHours(0, 0, 0, 0)));
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setHours(23, 59, 59, 999)));

  // Admin Story Management
  const { addStoryLog, updateStoryLog, deleteStoryLog } = useQueueMutations();
  const { data: gangs = [] } = useGangs();
  const { data: families = [] } = useFamilies();
  const combinedGangs = useMemo(() => {
    return [...gangs, ...families].map(g => g.name).sort();
  }, [gangs, families]);

  const [allDoctors, setAllDoctors] = useState<{discord_id: string, ic_name: string}[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

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

  useEffect(() => {
    if (!isOpen) return;
    fetchLogs();
  }, [isOpen, activeTab, startDate, endDate]);

  useEffect(() => {
    if (isAdmin && activeTab === 'story' && allDoctors.length === 0) {
      supabase.from('users').select('discord_id, ic_name').neq('role', 'user').then(({ data }) => {
        if (data) setAllDoctors(data);
      });
    }
  }, [isAdmin, activeTab, allDoctors.length]);

  // Compute summary report
  const summaryData = useMemo(() => {
    const summaryMap: Record<string, any> = {};

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
      
      const dayKey = new Date(log.start_time).toLocaleDateString('th-TH');
      if (!summaryMap[did].daily_manager_mins) {
        summaryMap[did].daily_manager_mins = {};
      }
      summaryMap[did].daily_manager_mins[dayKey] = (summaryMap[did].daily_manager_mins[dayKey] || 0) + (log.duration_minutes || 0);
    });

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

  const handleAddStory = () => {
    setEditForm({
      discord_id: '',
      start_time: new Date().toISOString().slice(0, 16),
      gang_1: '',
      gang_2: '',
      story_type: 'ไฟต์ตรง (1 คน)'
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEditStory = (log: any) => {
    const st = new Date(log.start_time);
    const offset = st.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(st.getTime() - offset)).toISOString().slice(0, 16);
    
    setEditForm({
      discord_id: log.discord_id,
      start_time: localISOTime,
      gang_1: log.gang_1,
      gang_2: log.gang_2,
      story_type: log.story_type
    });
    setEditingId(log.id);
    setIsAdding(false);
  };

  const handleSaveStory = async () => {
    if (!editForm.discord_id || !editForm.start_time) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    try {
      const payload = {
        discord_id: editForm.discord_id,
        gang_1: editForm.gang_1 || null,
        gang_2: editForm.gang_2 || null,
        story_type: editForm.story_type,
        start_time: new Date(editForm.start_time).toISOString(),
      };

      if (isAdding) {
        await addStoryLog(payload);
      } else if (editingId) {
        await updateStoryLog({ id: editingId, ...payload });
      }
      
      setIsAdding(false);
      setEditingId(null);
      fetchLogs(); // refresh
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (window.confirm('ยืนยันการลบประวัติสตอรี่นี้?')) {
      try {
        await deleteStoryLog(id);
        fetchLogs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
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
          justifyContent: 'space-between',
          alignItems: 'flex-start', 
          padding: '0 24px 16px 24px',
          borderBottom: '1px solid var(--qs-border, #e2e8f0)',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                วันนี้
              </button>
              <button 
                onClick={handleClearFilters}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
              >
                ดูทั้งหมด
              </button>
            </div>
          </div>
          {isAdmin && activeTab === 'story' && (
             <button 
               onClick={handleAddStory}
               style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}
             >
               <Plus size={16} /> เพิ่มประวัติย้อนหลัง
             </button>
          )}
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
                  <th>วันที่-เวลา</th>
                  <th>ชื่อหมอ</th>
                  <th>แก๊ง</th>
                  <th>รูปแบบ</th>
                  {isAdmin && <th style={{ width: '80px', textAlign: 'center' }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '0.75rem', width: '200px' }}>
                      <SmartDatePicker
                        selected={editForm.start_time ? new Date(editForm.start_time) : new Date()}
                        onChange={(date: Date | null) => {
                          if (date) {
                            const offset = date.getTimezoneOffset() * 60000;
                            const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                            setEditForm({...editForm, start_time: localISOTime});
                          }
                        }}
                        showTimeInput
                        timeFormat="HH:mm"
                        timeInputLabel="เวลา:"
                        timeCaption="เวลา"
                        dateFormat="dd/MM/yyyy HH:mm"
                        className="date-input"
                        wrapperClassName="w-full"
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <select 
                        value={editForm.discord_id} 
                        onChange={e => setEditForm({...editForm, discord_id: e.target.value})}
                        style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                      >
                        <option value="">-- เลือกแพทย์ --</option>
                        {allDoctors.map(d => (
                          <option key={d.discord_id} value={d.discord_id}>{d.ic_name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select 
                          value={editForm.gang_1 || ''} 
                          onChange={e => setEditForm({...editForm, gang_1: e.target.value})}
                          style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                        >
                          <option value="">- Gang 1 -</option>
                          {combinedGangs.map(g => (
                            <option key={`g1-${g}`} value={g}>{g}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: '0.75rem' }}>vs</span>
                        <select 
                          value={editForm.gang_2 || ''} 
                          onChange={e => setEditForm({...editForm, gang_2: e.target.value})}
                          style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                        >
                          <option value="">- Gang 2 -</option>
                          {combinedGangs.map(g => (
                            <option key={`g2-${g}`} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <select 
                        value={editForm.story_type} 
                        onChange={e => setEditForm({...editForm, story_type: e.target.value})}
                        style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                      >
                        <option value="ไฟต์ตรง (1 คน)">ไฟต์ตรง (1 คน)</option>
                        <option value="ไฟต์ตรง (2 คน)">ไฟต์ตรง (2 คน)</option>
                        <option value="สตอรี่ปล้น (1 คน)">สตอรี่ปล้น (1 คน)</option>
                        <option value="สตอรี่ปล้น (2 คน)">สตอรี่ปล้น (2 คน)</option>
                        <option value="ชิงตัว / ตีคุก (1 คน)">ชิงตัว / ตีคุก (1 คน)</option>
                        <option value="ชิงตัว / ตีคุก (2 คน)">ชิงตัว / ตีคุก (2 คน)</option>
                        <option value="ตีธง (1 คน)">ตีธง (1 คน)</option>
                        <option value="ตีธง (2 คน)">ตีธง (2 คน)</option>
                        <option value="Airdrop (1 คน)">Airdrop (1 คน)</option>
                        <option value="Airdrop (2 คน)">Airdrop (2 คน)</option>
                      </select>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button onClick={handleSaveStory} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                          <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                )}
                {storyLogs.length > 0 ? storyLogs.map(log => {
                  const isEd = editingId === log.id;
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.9rem' }}>
                        {isEd ? (
                          <SmartDatePicker
                            selected={editForm.start_time ? new Date(editForm.start_time) : new Date()}
                            onChange={(date: Date | null) => {
                              if (date) {
                                const offset = date.getTimezoneOffset() * 60000;
                                const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                                setEditForm({...editForm, start_time: localISOTime});
                              }
                            }}
                            showTimeInput
                            timeFormat="HH:mm"
                            timeInputLabel="เวลา:"
                            timeCaption="เวลา"
                            dateFormat="dd/MM/yyyy HH:mm"
                            className="date-input"
                            wrapperClassName="w-full"
                          />
                        ) : (
                          new Date(log.start_time).toLocaleString('th-TH', { 
                            dateStyle: 'short', timeStyle: 'short' 
                          })
                        )}
                      </td>
                      <td>
                        {isEd ? (
                          <select 
                            value={editForm.discord_id} 
                            onChange={e => setEditForm({...editForm, discord_id: e.target.value})}
                            style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                          >
                            {allDoctors.map(d => (
                              <option key={d.discord_id} value={d.discord_id}>{d.ic_name}</option>
                            ))}
                          </select>
                        ) : (
                          log.users?.ic_name
                        )}
                      </td>
                      <td>
                        {isEd ? (
                           <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                             <select 
                               value={editForm.gang_1 || ''} 
                               onChange={e => setEditForm({...editForm, gang_1: e.target.value})}
                               style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                             >
                               <option value="">- Gang 1 -</option>
                               {combinedGangs.map(g => (
                                 <option key={`g1-${g}`} value={g}>{g}</option>
                               ))}
                             </select>
                             <span style={{ fontSize: '0.75rem' }}>vs</span>
                             <select 
                               value={editForm.gang_2 || ''} 
                               onChange={e => setEditForm({...editForm, gang_2: e.target.value})}
                               style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                             >
                               <option value="">- Gang 2 -</option>
                               {combinedGangs.map(g => (
                                 <option key={`g2-${g}`} value={g}>{g}</option>
                               ))}
                             </select>
                           </div>
                        ) : (
                          log.gang_1 && log.gang_2 ? `${log.gang_1} vs ${log.gang_2}` : '-'
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isEd ? (
                           <select 
                             value={editForm.story_type} 
                             onChange={e => setEditForm({...editForm, story_type: e.target.value})}
                             style={{ width: '100%', padding: '0.25rem', fontSize: '0.85rem' }}
                           >
                             <option value="ไฟต์ตรง (1 คน)">ไฟต์ตรง (1 คน)</option>
                             <option value="ไฟต์ตรง (2 คน)">ไฟต์ตรง (2 คน)</option>
                             <option value="สตอรี่ปล้น (1 คน)">สตอรี่ปล้น (1 คน)</option>
                             <option value="สตอรี่ปล้น (2 คน)">สตอรี่ปล้น (2 คน)</option>
                             <option value="ชิงตัว / ตีคุก (1 คน)">ชิงตัว / ตีคุก (1 คน)</option>
                             <option value="ชิงตัว / ตีคุก (2 คน)">ชิงตัว / ตีคุก (2 คน)</option>
                             <option value="ตีธง (1 คน)">ตีธง (1 คน)</option>
                             <option value="ตีธง (2 คน)">ตีธง (2 คน)</option>
                             <option value="Airdrop (1 คน)">Airdrop (1 คน)</option>
                             <option value="Airdrop (2 คน)">Airdrop (2 คน)</option>
                           </select>
                        ) : (
                          log.story_type
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          {isEd ? (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={handleSaveStory} style={{ background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Save size={18} /></button>
                              <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={() => handleEditStory(log)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteStory(log.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                }) : !isAdding ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="empty-state">ไม่มีประวัติสตอรี่</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

