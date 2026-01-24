-- ============================================================
-- IP-NEXUS - DEADLINE REMINDERS TABLE
-- Recordatorios de plazos
-- ============================================================

-- Añadir columnas necesarias a matter_deadlines si no existen
ALTER TABLE matter_deadlines 
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'system';

-- Recordatorios de plazos
CREATE TABLE IF NOT EXISTS deadline_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_id UUID NOT NULL REFERENCES matter_deadlines(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  days_before INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  sent_to TEXT[] DEFAULT '{}',
  channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('email', 'in_app', 'push', 'sms')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_date ON deadline_reminders(reminder_date, status);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_deadline ON deadline_reminders(deadline_id);

-- RLS
ALTER TABLE deadline_reminders ENABLE ROW LEVEL SECURITY;

-- Política simple para deadline_reminders
DROP POLICY IF EXISTS "deadline_reminders_policy" ON deadline_reminders;
CREATE POLICY "deadline_reminders_policy" ON deadline_reminders FOR ALL USING (true);