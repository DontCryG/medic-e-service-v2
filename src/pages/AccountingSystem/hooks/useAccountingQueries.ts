import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { fetchAllRows } from '@/utils/supabasePagination';

export const accountingKeys = {
  finance: ['accounting_logs'],
  inventory: ['inventory_logs'],
};

export function useFinanceLogs() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = `accounting_logs_changes_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounting_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: accountingKeys.finance });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: accountingKeys.finance,
    queryFn: async () => {
      const query = supabase
        .from('accounting_logs')
        .select(`
          *,
          users (
            ic_name,
            positions (name)
          )
        `)
        .order('created_at', { ascending: false });

      const data = await fetchAllRows(query);
      
      const cleanedData = data?.map((log: any) => ({
        ...log,
        users: {
          ...log.users,
          positions: Array.isArray(log.users?.positions) 
            ? log.users.positions[0] 
            : log.users?.positions
        }
      }));
      
      return cleanedData || [];
    },
  });
}

export function useInventoryLogs() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channelName = `inventory_logs_changes_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: accountingKeys.inventory });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: accountingKeys.inventory,
    queryFn: async () => {
      const query = supabase
        .from('inventory_logs')
        .select(`
          *,
          users (
            ic_name,
            positions (name)
          )
        `)
        .order('created_at', { ascending: false });

      const data = await fetchAllRows(query);
      
      const cleanedData = data?.map((log: any) => ({
        ...log,
        users: {
          ...log.users,
          positions: Array.isArray(log.users?.positions) 
            ? log.users.positions[0] 
            : log.users?.positions
        }
      }));
      
      return cleanedData || [];
    },
  });
}

export function useInventoryStock() {
  const { data: logs } = useInventoryLogs();
  
  if (!logs) return [];
  
  // Calculate stock for each unique item_name
  const stockMap: Record<string, number> = {};
  
  logs.forEach(log => {
    const name = log.item_name.trim();
    if (!stockMap[name]) {
      stockMap[name] = 0;
    }
    
    if (log.type === 'receive') {
      stockMap[name] += log.quantity;
    } else if (log.type === 'disburse') {
      stockMap[name] -= log.quantity;
    }
  });
  
  // Convert to array
  return Object.entries(stockMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);
}
