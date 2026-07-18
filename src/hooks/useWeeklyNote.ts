import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

export type WeeklyNoteRow = Database['public']['Tables']['weekly_notes']['Row'];

export function useWeeklyNote(userId: string | undefined, weekStartDate: Date) {
  const queryClient = useQueryClient();
  const weekKey = format(weekStartDate, 'yyyy-MM-dd');

  const { data: weeklyNote, isLoading } = useQuery({
    queryKey: ['weekly_note', userId, weekKey],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('weekly_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekKey)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyNoteRow | null;
    },
    enabled: !!userId,
  });

  const upsertNote = useMutation({
    mutationFn: async (notes: string) => {
      if (!userId) throw new Error('No user ID');
      const { data, error } = await supabase
        .from('weekly_notes')
        .upsert(
          { user_id: userId, week_start_date: weekKey, notes, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,week_start_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as WeeklyNoteRow;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weekly_note', userId, weekKey] }),
  });

  return { weeklyNote: weeklyNote ?? null, isLoading, upsertNote };
}
