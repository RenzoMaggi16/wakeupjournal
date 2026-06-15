import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

export type ROIEntryRow = Database['public']['Tables']['roi_entries']['Row'];
export type ROIEntryInsert = Database['public']['Tables']['roi_entries']['Insert'];
export type ROIEntryUpdate = Database['public']['Tables']['roi_entries']['Update'];

export function useROIEntries(userId?: string) {
  const queryClient = useQueryClient();

  const { data: rawEntries = [], isLoading } = useQuery({
    queryKey: ['roi_entries', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('roi_entries')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: true });
      if (error) throw error;
      return data as ROIEntryRow[];
    },
    enabled: !!userId,
  });

  // Compute running totals client-side after fetch
  const entries = useMemo(() => {
    let cumInversion = 0;
    let cumRetiros = 0;
    return rawEntries.map(entry => {
      cumInversion += Number(entry.inversion ?? 0);
      cumRetiros += Number(entry.monto_retiros ?? 0);
      const balanceMensual = Number(entry.monto_retiros ?? 0) - Number(entry.inversion ?? 0);
      const balanceAcumulado = cumRetiros - cumInversion;
      return {
        ...entry,
        balance_mensual: balanceMensual,
        inversion_acumulada: cumInversion,
        retiros_acumulados: cumRetiros,
        balance_acumulado: balanceAcumulado,
      };
    });
  }, [rawEntries]);

  const summaryStats = useMemo(() => {
    const totalInversion = entries.at(-1)?.inversion_acumulada ?? 0;
    const totalRetiros = entries.at(-1)?.retiros_acumulados ?? 0;
    const balanceNeto = totalRetiros - totalInversion;
    const roiPct = totalInversion > 0 ? (balanceNeto / totalInversion) * 100 : 0;
    return { totalInversion, totalRetiros, balanceNeto, roiPct };
  }, [entries]);

  const addEntry = useMutation({
    mutationFn: async (newEntry: Omit<ROIEntryInsert, 'user_id'>) => {
      if (!userId) throw new Error("No user ID");
      const { data, error } = await supabase
        .from('roi_entries')
        .insert({ ...newEntry, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roi_entries', userId] }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ROIEntryUpdate> & { id: string }) => {
      if (!userId) throw new Error("No user ID");
      const { data, error } = await supabase
        .from('roi_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roi_entries', userId] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("No user ID");
      const { error } = await supabase
        .from('roi_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roi_entries', userId] }),
  });

  return { entries, summaryStats, isLoading, addEntry, updateEntry, deleteEntry };
}
