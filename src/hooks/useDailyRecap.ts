import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

export type DailyRecapRow = Database['public']['Tables']['daily_recaps']['Row'];
export type DailyRecapInsert = Database['public']['Tables']['daily_recaps']['Insert'];

const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export function useDailyRecap(userId: string | undefined, date: Date | null) {
  const queryClient = useQueryClient();
  const recapDate = date ? dateKey(date) : undefined;

  const { data: recap, isLoading } = useQuery({
    queryKey: ['daily_recap', userId, recapDate],
    queryFn: async () => {
      if (!userId || !recapDate) return null;
      const { data, error } = await supabase
        .from('daily_recaps')
        .select('*')
        .eq('user_id', userId)
        .eq('recap_date', recapDate)
        .maybeSingle();
      if (error) throw error;
      return data as DailyRecapRow | null;
    },
    enabled: !!userId && !!recapDate,
  });

  const upsertRecap = useMutation({
    mutationFn: async (fields: Omit<DailyRecapInsert, 'user_id' | 'recap_date'>) => {
      if (!userId || !recapDate) throw new Error('No user ID or date');
      const { data, error } = await supabase
        .from('daily_recaps')
        .upsert(
          { ...fields, user_id: userId, recap_date: recapDate, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,recap_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as DailyRecapRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_recap', userId, recapDate] });
      queryClient.invalidateQueries({ queryKey: ['month_recaps', userId] });
    },
  });

  return { recap: recap ?? null, isLoading, upsertRecap };
}

export type RecapImageSlot = 'M1' | 'M5' | 'M15' | 'TRADE1' | 'TRADE2' | 'TRADE3';

export async function uploadRecapImage(
  userId: string,
  recapDate: Date,
  timeframe: RecapImageSlot,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/recaps/${dateKey(recapDate)}_${timeframe}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('trade-images')
    .upload(fileName, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('trade-images').getPublicUrl(fileName);
  if (!publicUrlData?.publicUrl) throw new Error('No se pudo obtener la URL pública');
  return publicUrlData.publicUrl;
}
