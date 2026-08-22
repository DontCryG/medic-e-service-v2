import { useState, useRef } from 'react';
import DutyControls from './DutySystem/components/DutyControls';
import LiveUsersList from './DutySystem/components/LiveUsersList';
import DutyHistoryTable from './DutySystem/components/DutyHistoryTable';
import './DutySystem.css';
import { supabase } from '@/lib/supabase';

// Import our new hooks
import { useCurrentSession, useLiveUsers, useDutyHistory } from './DutySystem/hooks/useDutyQueries';
import { useClockIn, useToggleBreak, useClockOut, useAdminToggleBreak, useAdminClockOut } from './DutySystem/hooks/useDutyMutations';
import { useDutyRealtime } from './DutySystem/hooks/useDutyRealtime';
import Swal from 'sweetalert2';

export interface DutySystemProps {
  profile: any;
}

export default function DutySystem({ profile }: DutySystemProps) {
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  });
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 50;
  
  // Real-time synchronization
  useDutyRealtime();

  // Queries
  const { data: currentSession, isLoading: loadingSession } = useCurrentSession(profile?.discord_id);
  const { data: liveUsers = [], isLoading: loadingLive } = useLiveUsers();
  const { data: historyData } = useDutyHistory(profile?.discord_id, profile?.role, startDate as Date, endDate as Date, historyPage, itemsPerPage);
  
  const history = historyData?.data || [];
  const historyTotal = historyData?.count || 0;

  const loading = loadingSession || loadingLive;

  // Mutations
  const clockInMutation = useClockIn();
  const toggleBreakMutation = useToggleBreak();
  const clockOutMutation = useClockOut();
  const adminToggleBreakMutation = useAdminToggleBreak();
  const adminClockOutMutation = useAdminClockOut();

  const processingRef = useRef(false);

  const handleClockIn = () => {
    if (clockInMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    clockInMutation.mutate(profile.discord_id, {
      onSettled: () => { processingRef.current = false; }
    });
  };

  const handleBreak = () => {
    if (toggleBreakMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    toggleBreakMutation.mutate(currentSession, {
      onSettled: () => { processingRef.current = false; }
    });
  };
  
  const handleClockOut = async () => {
    if (!currentSession || clockOutMutation.isPending || processingRef.current) return;
    processingRef.current = true;
    
    try {
      // Check queue status first
      const { data: queueData } = await supabase
        .from('queue_status')
        .select('status')
        .eq('discord_id', profile.discord_id)
        .maybeSingle();
        
      if (queueData) {
        if (queueData.status === 'story') {
          Swal.fire({
            title: 'ไม่สามารถออกเวรได้',
            text: 'คุณกำลังติดเคสสตอรี่อยู่ กรุณาจบเคสสตอรี่หรือยกเลิกก่อนกดออกเวรครับ',
            icon: 'warning',
            confirmButtonColor: '#ef4444'
          });
          processingRef.current = false;
          return;
        }
        if (queueData.status === 'manager') {
          Swal.fire({
            title: 'ไม่สามารถออกเวรได้',
            text: 'คุณกำลังเข้าเวรในคิว หรือกำลังจัดการคิวอยู่ กรุณาออกจากการจัดการคิว หรือปิดสตอรี่ก่อนออกเวรครับ',
            icon: 'warning',
            confirmButtonColor: '#ef4444'
          });
          processingRef.current = false;
          return;
        }
      }
    } catch (err) {
      console.error('Error checking queue status:', err);
    }
    
    clockOutMutation.mutate(currentSession, {
      onSettled: () => { processingRef.current = false; }
    });
  };

  const handleAdminToggleBreak = async (session: any) => {
    const result = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะพักเบรก',
      text: `ต้องการเปลี่ยนสถานะการพักเบรกของ ${session.users?.ic_name} ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'เปลี่ยนสถานะพักเบรก',
      cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) adminToggleBreakMutation.mutate(session);
  };

  const handleAdminClockOut = async (session: any) => {
    try {
      const { data: queueData } = await supabase
        .from('queue_status')
        .select('status')
        .eq('discord_id', session.discord_id)
        .maybeSingle();
        
      if (queueData) {
        if (queueData.status === 'story') {
          Swal.fire({ title: 'ไม่สามารถออกเวรได้', text: 'แพทย์ท่านนี้กำลังอยู่ในเคสสตอรี่ โปรดแจ้งให้จบเคส หรือบังคับปลดจากหน้าจัดการคิวก่อน', icon: 'warning' });
          return;
        }
        if (queueData.status === 'manager') {
          Swal.fire({ title: 'ไม่สามารถออกเวรได้', text: 'แพทย์ท่านนี้กำลังทำหน้าที่ "หมอรันคิว" อยู่ โปรดบังคับปลดจากหน้าจัดการคิวก่อน', icon: 'warning' });
          return;
        }
      }
    } catch (err) {
      console.error('Error checking queue status for admin:', err);
    }

    const result = await Swal.fire({
      title: 'ยืนยันการบังคับออกเวร',
      text: `ต้องการให้ ${session.users?.ic_name} ออกเวรใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'บังคับออกเวร',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) adminClockOutMutation.mutate(session);
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setHistoryPage(1);
  };

  if (!profile) return null;

  const isMutating = clockInMutation.isPending || toggleBreakMutation.isPending || clockOutMutation.isPending;

  return (
    <div className="duty-container">
      <DutyControls 
        profile={profile}
        avatarUrl={profile?.avatar_url}
        currentSession={currentSession}
        loading={loading || isMutating}
        onClockIn={handleClockIn}
        onBreak={handleBreak}
        onClockOut={handleClockOut}
      />

      <div className="duty-content-grid">
        <LiveUsersList 
          liveUsers={liveUsers}
          profile={profile}
          loading={loading || adminToggleBreakMutation.isPending || adminClockOutMutation.isPending}
          onAdminToggleBreak={handleAdminToggleBreak}
          onAdminClockOut={handleAdminClockOut}
        />

        <DutyHistoryTable 
          history={history}
          historyTotal={historyTotal}
          historyPage={historyPage}
          itemsPerPage={itemsPerPage}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(date) => { 
            if (date) {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              setStartDate(d);
              setHistoryPage(1);
            } else {
              setStartDate(null);
            }
          }}
          onEndDateChange={(date) => { 
            if (date) {
              const d = new Date(date);
              d.setHours(23, 59, 59, 999);
              setEndDate(d);
            } else {
              setEndDate(null);
            }
            setHistoryPage(1);
          }}
          onClearFilters={handleClearFilters}
          onPageChange={setHistoryPage}
        />
      </div>
    </div>
  );
}

