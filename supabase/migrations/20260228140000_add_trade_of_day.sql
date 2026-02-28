-- Add "Trade del Día" columns to trades table
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS is_trade_of_day boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trade_of_day_image text,
  ADD COLUMN IF NOT EXISTS trade_of_day_notes text;
