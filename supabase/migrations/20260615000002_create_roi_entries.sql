CREATE TABLE roi_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  cuentas_compradas integer NULL,
  inversion numeric(10, 2) NULL,
  retiros integer NULL DEFAULT 0,
  monto_retiros numeric(10, 2) NULL DEFAULT 0,
  balance_mensual numeric(10, 2) NULL,
  empresa_fondeo text NULL,
  inversion_acumulada numeric(10, 2) NULL,
  retiros_acumulados numeric(10, 2) NULL,
  balance_acumulado numeric(10, 2) NULL,
  observaciones text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roi_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roi entries"
  ON roi_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roi entries"
  ON roi_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roi entries"
  ON roi_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roi entries"
  ON roi_entries FOR DELETE USING (auth.uid() = user_id);
