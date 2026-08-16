import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Gang {
  id: string;
  name: string;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

// --- Gangs ---
export const useGangs = () => {
  return useQuery({
    queryKey: ['gangs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gangs').select('*').order('name');
      if (error) throw error;
      return (data as Gang[]) || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useAddGang = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('gangs').insert([{ name }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gangs'] }),
  });
};

export const useUpdateGang = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase.from('gangs').update({ name }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gangs'] }),
  });
};

export const useDeleteGang = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gangs').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gangs'] }),
  });
};

// --- Families ---
export const useFamilies = () => {
  return useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const { data, error } = await supabase.from('families').select('*').order('name');
      if (error) throw error;
      return (data as Family[]) || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useAddFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('families').insert([{ name }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['families'] }),
  });
};

export const useUpdateFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase.from('families').update({ name }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['families'] }),
  });
};

export const useDeleteFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('families').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['families'] }),
  });
};
