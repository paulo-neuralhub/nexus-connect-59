-- ============================================
-- P61: COLABORACIÓN EN TIEMPO REAL
-- ============================================

-- 1. COMENTARIOS EN EXPEDIENTES
CREATE TABLE IF NOT EXISTS matter_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Autor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Contenido
  content TEXT NOT NULL,
  
  -- Menciones (@usuario)
  mentions UUID[] DEFAULT '{}',
  
  -- Respuesta a otro comentario (threading)
  parent_id UUID REFERENCES matter_comments(id) ON DELETE CASCADE,
  
  -- Adjuntos
  attachments JSONB DEFAULT '[]',
  
  -- Edición
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matter_comments_matter ON matter_comments(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_comments_parent ON matter_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_matter_comments_mentions ON matter_comments USING GIN(mentions);

ALTER TABLE matter_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_access_comments" ON matter_comments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 2. PRESENCIA DE USUARIOS
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Ubicación actual
  current_page TEXT,
  current_matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
  
  -- Estado
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  
  -- Última actividad
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata del cliente
  device_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_presence_org ON user_presence(organization_id);
CREATE INDEX IF NOT EXISTS idx_presence_matter ON user_presence(current_matter_id);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_see_presence" ON user_presence
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "users_manage_own_presence" ON user_presence
  FOR ALL USING (user_id = auth.uid());

-- 3. ACTIVIDAD EN EXPEDIENTES
CREATE TABLE IF NOT EXISTS matter_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Tipo de actividad
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created',
    'updated',
    'status_changed',
    'comment_added',
    'document_uploaded',
    'document_signed',
    'task_created',
    'task_completed',
    'deadline_added',
    'deadline_completed',
    'time_logged',
    'assigned',
    'note_added'
  )),
  
  -- Descripción
  description TEXT NOT NULL,
  
  -- Datos del cambio
  changes JSONB DEFAULT '{}',
  
  -- Referencia al objeto relacionado
  reference_type TEXT,
  reference_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_matter ON matter_activity(matter_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON matter_activity(matter_id, created_at DESC);

ALTER TABLE matter_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_see_activity" ON matter_activity
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "org_members_create_activity" ON matter_activity
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- 4. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE matter_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE matter_activity;

-- 5. TRIGGER PARA NOTIFICAR MENCIONES EN COMENTARIOS
CREATE OR REPLACE FUNCTION notify_comment_mentions()
RETURNS TRIGGER AS $$
BEGIN
  IF array_length(NEW.mentions, 1) > 0 THEN
    INSERT INTO notifications (user_id, organization_id, type, title, message, link, metadata)
    SELECT 
      unnest(NEW.mentions),
      NEW.organization_id,
      'mention',
      'Te han mencionado en un comentario',
      substring(NEW.content from 1 for 100),
      '/app/docket/' || NEW.matter_id,
      jsonb_build_object('comment_id', NEW.id, 'matter_id', NEW.matter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_mention ON matter_comments;
CREATE TRIGGER on_comment_mention
  AFTER INSERT ON matter_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_mentions();

-- 6. TRIGGER PARA REGISTRAR ACTIVIDAD EN COMENTARIOS
CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  SELECT full_name INTO user_name FROM users WHERE id = NEW.user_id;
  
  INSERT INTO matter_activity (
    matter_id,
    organization_id, 
    user_id,
    activity_type,
    description,
    reference_type,
    reference_id
  ) VALUES (
    NEW.matter_id,
    NEW.organization_id,
    NEW.user_id,
    'comment_added',
    COALESCE(user_name, 'Usuario') || ' añadió un comentario',
    'comment',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_added ON matter_comments;
CREATE TRIGGER on_comment_added
  AFTER INSERT ON matter_comments
  FOR EACH ROW
  WHEN (NEW.is_deleted = false)
  EXECUTE FUNCTION log_comment_activity();

-- 7. TRIGGER PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_matter_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_matter_comments_timestamp ON matter_comments;
CREATE TRIGGER update_matter_comments_timestamp
  BEFORE UPDATE ON matter_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_matter_comments_updated_at();