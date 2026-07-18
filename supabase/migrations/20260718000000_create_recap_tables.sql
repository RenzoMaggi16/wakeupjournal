-- Daily recap: one row per user per day
CREATE TABLE public.daily_recaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recap_date date NOT NULL,

  -- Contexto del día
  session_bias_pre text,
  session_bias_post text,
  main_session text,
  market_structure text,
  key_levels text,

  -- Noticias
  had_news boolean DEFAULT false,
  news_notes text,

  -- Imágenes multi-timeframe (mismo patrón que trades)
  image_url_m1 text,
  image_url_m5 text,
  image_url_m15 text,

  -- Performance / disciplina
  followed_plan boolean,
  emotional_state text,

  -- Reflexión
  lessons_learned text,
  notes_for_tomorrow text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT daily_recaps_user_date_unique UNIQUE (user_id, recap_date)
);

-- Weekly notes: one row per user per week (anchored on the Monday)
CREATE TABLE public.weekly_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT weekly_notes_user_week_unique UNIQUE (user_id, week_start_date)
);

ALTER TABLE public.daily_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily recaps"
  ON public.daily_recaps FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily recaps"
  ON public.daily_recaps FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily recaps"
  ON public.daily_recaps FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily recaps"
  ON public.daily_recaps FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own weekly notes"
  ON public.weekly_notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly notes"
  ON public.weekly_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly notes"
  ON public.weekly_notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly notes"
  ON public.weekly_notes FOR DELETE USING (auth.uid() = user_id);
