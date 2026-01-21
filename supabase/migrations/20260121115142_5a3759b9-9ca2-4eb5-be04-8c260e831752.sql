-- P62: Calendar Integration Tables

-- Calendar connections (OAuth tokens and sync config)
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
  
  -- OAuth tokens (encrypted in practice)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Selected calendar
  calendar_id TEXT NOT NULL,
  calendar_name TEXT,
  calendar_color TEXT,
  
  -- Sync configuration
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction TEXT DEFAULT 'both' CHECK (sync_direction IN ('to_calendar', 'from_calendar', 'both')),
  sync_deadlines BOOLEAN DEFAULT true,
  sync_tasks BOOLEAN DEFAULT true,
  sync_meetings BOOLEAN DEFAULT true,
  
  -- Status
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'paused', 'disconnected')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_calendar_connections_user ON calendar_connections(user_id);
CREATE INDEX idx_calendar_connections_sync ON calendar_connections(sync_enabled, sync_status) 
  WHERE sync_enabled = true AND sync_status = 'active';

-- Enable RLS
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_calendars" ON calendar_connections
  FOR ALL USING (user_id = auth.uid());

-- Event mappings between IP-NEXUS and external calendars
CREATE TABLE calendar_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
  
  -- Internal reference
  source_type TEXT NOT NULL CHECK (source_type IN ('deadline', 'task', 'meeting', 'reminder', 'time_entry')),
  source_id UUID NOT NULL,
  
  -- External reference
  external_event_id TEXT NOT NULL,
  external_calendar_id TEXT NOT NULL,
  
  -- Sync state
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_hash TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_mappings_source ON calendar_event_mappings(source_type, source_id);
CREATE INDEX idx_event_mappings_external ON calendar_event_mappings(external_event_id);
CREATE UNIQUE INDEX idx_event_mappings_unique ON calendar_event_mappings(
  calendar_connection_id, source_type, source_id
);

-- RLS for event mappings
ALTER TABLE calendar_event_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_mappings" ON calendar_event_mappings
  FOR ALL USING (
    calendar_connection_id IN (
      SELECT id FROM calendar_connections WHERE user_id = auth.uid()
    )
  );

-- Availability slots for team scheduling
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Day of week (0=Sunday, 6=Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Time range
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Type
  slot_type TEXT DEFAULT 'available' CHECK (slot_type IN ('available', 'busy', 'tentative')),
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_slots_user ON availability_slots(user_id);

-- RLS
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_availability" ON availability_slots
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "org_members_view_availability" ON availability_slots
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Availability exceptions (specific dates)
CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  exception_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_exceptions_user_date ON availability_exceptions(user_id, exception_date);

-- RLS
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_exceptions" ON availability_exceptions
  FOR ALL USING (user_id = auth.uid());

-- Function to check token expiry and refresh status
CREATE OR REPLACE FUNCTION get_active_calendar_connections()
RETURNS SETOF calendar_connections
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM calendar_connections
  WHERE sync_enabled = true 
    AND sync_status = 'active'
    AND (token_expires_at IS NULL OR token_expires_at > NOW() - INTERVAL '1 hour');
$$;