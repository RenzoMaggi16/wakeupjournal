-- Add customizable min profit threshold per account for the consistency rule
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS min_profit_threshold numeric DEFAULT NULL;
