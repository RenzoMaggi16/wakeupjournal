-- Create rithmic_connections table
CREATE TABLE rithmic_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  rithmic_account_id text NOT NULL,
  system_name text NOT NULL,
  gateway_environment text NOT NULL DEFAULT 'demo', -- 'demo' | 'live'
  account_creation_date date NULL,
  last_sync_at timestamptz NULL,
  last_synced_order_id text NULL,
  status text NOT NULL DEFAULT 'disconnected', -- 'disconnected' | 'syncing' | 'connected' | 'error'
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rithmic_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rithmic connection"
  ON rithmic_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rithmic connection"
  ON rithmic_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rithmic connection"
  ON rithmic_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rithmic connection"
  ON rithmic_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Add rithmic_order_id to trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS rithmic_order_id text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trades_rithmic_order_id_unique 
  ON trades (user_id, rithmic_order_id) 
  WHERE rithmic_order_id IS NOT NULL;
