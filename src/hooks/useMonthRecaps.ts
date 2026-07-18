import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { DailyRecapRow } from '@/hooks/useDailyRecap';

export function useMonthRecaps(userId: string | undefined, month: Date) {
  const monthKey = format(month, 'yyyy-MM');

  const { data: recaps = [], isLoading } = useQuery({
    queryKey: ['month_recaps', userId, monthKey],
    queryFn: async () => {
      if (!userId) return [];
      const start = format(startOfMonth(month), 'yyyy-MM-dd');
      const end = format(endOfMonth(month), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_recaps')
        .select('*')
        .eq('user_id', userId)
        .gte('recap_date', start)
        .lte('recap_date', end);
      if (error) throw error;
      return data as DailyRecapRow[];
    },
    enabled: !!userId,
  });

  const recapsByDate = new Map(recaps.map((r) => [r.recap_date, r]));

  return { recaps, recapsByDate, isLoading };
}
