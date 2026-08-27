import { useState, useMemo, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

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
  
  // Modal states
  const [editingUser, setEditingUser] = useState<any>(null);
  const [addingDutyUser, setAddingDutyUser] = useState<any>(null);

  const { users } = useMemo(() => {
    if (!usersData?.raw) {
      return { users: [] };
    }
    const sortedData = [...usersData.raw].sort((a, b) => {
      const rankA = a.positions?.rank??99;
      const rankB = b.positions?.rank??99;
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

  const handleDeleteUser = async (user: any) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?',
      html: `คุณต้องการลบข้อมูลของ <b>${user.ic_name}</b> ใช่หรือไม่?<br/><span style="color: #ef4444; font-size: 0.9em;">(การกระทำนี้ไม่สามารถกู้คืนได้)</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      const toastId = toast.loading('กำลังลบข้อมูล...');
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('discord_id', user.discord_id);

        if (error) throw error;
        
        toast.success('ลบข้อมูลสำเร็จ', { id: toastId });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch (error: any) {
        toast.error('เกิดข้อผิดพลาด: ' + error.message, { id: toastId });
      }
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6">
      <PersonnelTable 
        profile={profile}
        filteredUsers={filteredUsers as any}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        onEditClick={setEditingUser}
        onAddDutyClick={setAddingDutyUser}
        onDeleteUser={handleDeleteUser}
      />

      {editingUser && (
        <Suspense fallback={null}>
          <EditPersonnelModal 
            user={editingUser}
            availablePositions={availablePositions}
            onClose={() => setEditingUser(null)}
            onSuccess={() => {
              setEditingUser(null);
            }}
          />
        </Suspense>
      )}

      {addingDutyUser && (
        <Suspense fallback={null}>
          <AddDutyModal 
            user={addingDutyUser}
            onClose={() => setAddingDutyUser(null)}
            onSuccess={() => {
              setAddingDutyUser(null);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
