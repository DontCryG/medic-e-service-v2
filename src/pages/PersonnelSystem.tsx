import { useState, useMemo, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import './PersonnelSystem.css';

import PersonnelTable from './PersonnelSystem/components/PersonnelTable';

const EditPersonnelModal = lazy(() => import('./PersonnelSystem/components/EditPersonnelModal'));
const AddDutyModal = lazy(() => import('./PersonnelSystem/components/AddDutyModal'));
import { useUsers } from '../hooks/useUsers';
import { usePositions } from '../hooks/usePositions';
import { useDebounce } from '../hooks/useDebounce';
import { usePersonnelRealtime } from '../hooks/usePersonnelRealtime';

export interface PersonnelSystemProps {
  profile: any;
}

export default function PersonnelSystem({ profile }: PersonnelSystemProps) {
  const queryClient = useQueryClient();
  
  // Real-time synchronization
  usePersonnelRealtime();

  const { data: usersData, isLoading: loadingUsers } = useUsers();
  const { data: positionsData, isLoading: loadingPositions } = usePositions();
  
  const loading = loadingUsers || loadingPositions;
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterRole, setFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add Duty Modal State
  const [addingDutyUser, setAddingDutyUser] = useState<any>(null);
  const [dutyClockIn, setDutyClockIn] = useState<Date | null>(null);
  const [dutyClockOut, setDutyClockOut] = useState<Date | null>(null);

  const { users } = useMemo(() => {
    if (!usersData?.raw) {
      return { users: [] };
    }
    const sortedData = [...usersData.raw].sort((a, b) => {
      const rankA = a.positions?.rank ?? 99;
      const rankB = b.positions?.rank ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    return { users: sortedData };
  }, [usersData]);

  const availablePositions = useMemo(() => {
    return positionsData || [];
  }, [positionsData]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.ic_name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                          (user.discord_id || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
                          
    let matchesRole = true;
    if (filterRole === 'admin') {
      matchesRole = user.role === 'admin' || user.role === 'superadmin';
    } else if (filterRole === 'medic') {
      matchesRole = user.role === 'medic';
    } else if (filterRole === 'user') {
      matchesRole = user.role === 'user';
    } else if (filterRole === 'resigned') {
      matchesRole = user.role === 'resigned';
    }
    
    return matchesSearch && matchesRole;
  });

  // Edit actions
  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPosition(user.position_id || '');
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditRole('');
    setEditPosition('');
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: editRole, position_id: editPosition || null })
        .eq('discord_id', editingUser.discord_id);

      if (error) throw error;
      
      toast.success('บันทึกข้อมูลสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeEditModal();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    const result = await Swal.fire({
      title: 'ยืนยันการพ้นสภาพ?',
      text: `คุณต้องการเปลี่ยนสถานะของ ${user.ic_name} เป็น "พ้นสภาพ" ใช่หรือไม่?\n\nข้อมูลการทำงานและเวรต่างๆ จะยังคงอยู่ แต่ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้อีก`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ยืนยันการพ้นสภาพ',
      cancelButtonText: 'ยกเลิก',
      background: 'var(--surface-color)',
      color: 'var(--text-color)',
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ role: 'resigned' })
          .eq('discord_id', user.discord_id);

        if (error) throw error;
        toast.success('อัปเดตสถานะเป็นพ้นสภาพสำเร็จ');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch (error: any) {
        toast.error('เกิดข้อผิดพลาด: ' + error.message);
      }
    }
  };

  // Add Duty Actions
  const handleAddDutyClick = (user: any) => {
    setAddingDutyUser(user);
    setDutyClockIn(null);
    setDutyClockOut(null);
  };

  const closeDutyModal = () => {
    setAddingDutyUser(null);
    setDutyClockIn(null);
    setDutyClockOut(null);
  };

  const handleSaveDuty = async () => {
    if (!dutyClockIn || !dutyClockOut) {
      toast.error('กรุณาระบุเวลาเข้าเวรและออกเวรให้ครบถ้วน');
      return;
    }
    
    if (dutyClockOut <= dutyClockIn) {
      toast.error('เวลาออกเวรต้องอยู่หลังเวลาเข้าเวร');
      return;
    }

    setIsSaving(true);
    try {
      const diffMs = dutyClockOut.getTime() - dutyClockIn.getTime();
      const totalDutyMinutes = Math.floor(Math.max(0, diffMs / 60000));

      if (totalDutyMinutes === 0) {
        toast.error('ไม่สามารถบันทึกเวลาเข้าเวร 0 นาทีได้');
        return;
      }

      const { error } = await supabase
        .from('duty_logs')
        .insert([{
          discord_id: addingDutyUser.discord_id,
          status: 'completed',
          clock_in: dutyClockIn.toISOString(),
          clock_out: dutyClockOut.toISOString(),
          total_break_minutes: 0,
          total_duty_minutes: totalDutyMinutes
        }]);

      if (error) throw error;

      toast.success('บันทึกการเข้าเวรย้อนหลังสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      queryClient.invalidateQueries({ queryKey: ['duty'] });
      closeDutyModal();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="personnel-container">
      <PersonnelTable 
        profile={profile}
        filteredUsers={filteredUsers}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        onEditClick={handleEditClick}
        onAddDutyClick={handleAddDutyClick}
        onDeleteUser={handleDeleteUser}
      />

      {editingUser && (
        <Suspense fallback={null}>
          <EditPersonnelModal 
            user={editingUser}
            editRole={editRole}
            setEditRole={setEditRole}
            editPosition={editPosition}
            setEditPosition={setEditPosition}
            availablePositions={availablePositions}
            isSaving={isSaving}
            onClose={closeEditModal}
            onSave={handleSaveEdit}
          />
        </Suspense>
      )}

      {addingDutyUser && (
        <Suspense fallback={null}>
          <AddDutyModal 
            user={addingDutyUser}
            dutyClockIn={dutyClockIn}
            setDutyClockIn={setDutyClockIn}
            dutyClockOut={dutyClockOut}
            setDutyClockOut={setDutyClockOut}
            isSaving={isSaving}
            onClose={closeDutyModal}
            onSave={handleSaveDuty}
          />
        </Suspense>
      )}
    </div>
  );
}
