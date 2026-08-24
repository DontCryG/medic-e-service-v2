import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface Position {
  id: string;
  name: string;
  rank: number;
  oc_rate: number;
  ic_rate: number;
}

export const usePositions = () => {
  const { user } = useAuthStore();
  return useQuery({
    enabled: !!user,
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('rank');
        
      if (error) throw error;
      return (data as Position[]) || [];
    },
    staleTime: 30 * 1000, 
    gcTime: 15 * 60 * 1000,
  });
};

export const useAddPosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (position: Omit<Position, 'id'>) => {
      const { data, error } = await supabase
        .from('positions')
        .insert([{
          name: position.name,
          rank: position.rank,
          oc_rate: position.oc_rate,
          ic_rate: position.ic_rate,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    }
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (position: Position) => {
      const { data, error } = await supabase
        .from('positions')
        .update({
          name: position.name,
          rank: position.rank,
          oc_rate: position.oc_rate,
          ic_rate: position.ic_rate,
        })
        .eq('id', position.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    }
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Check if any user is using this position
      const { data: usersWithPosition } = await supabase
        .from('users')
        .select('discord_id')
        .eq('position_id', id)
        .limit(1);

      if (usersWithPosition && usersWithPosition.length > 0) {
        throw new Error('ไม่สามารถลบตำแหน่งนี้ได้ เนื่องจากมีบุคลากรที่กำลังใช้ตำแหน่งนี้อยู่ กรุณาเปลี่ยนตำแหน่งของบุคลากรก่อน');
      }

      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    }
  });
};

