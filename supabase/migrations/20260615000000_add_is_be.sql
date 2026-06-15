-- Add "Break-Even" flag column to trades table
-- A trade is manually flagged as BE when the trader considers it
-- a neutral outcome regardless of the exact pnl_neto value.
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS is_be boolean NULL DEFAULT false;
