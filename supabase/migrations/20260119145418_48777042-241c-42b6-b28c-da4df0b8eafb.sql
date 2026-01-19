-- =====================================================
-- RBAC SYSTEM - FASE 1: Database Schema
-- =====================================================

-- 1. Create enum for permission actions
CREATE TYPE public.permission_action AS ENUM ('view', 'create', 'edit', 'delete', 'export', 'configure', 'manage', 'approve');

-- 2. Create enum for permission scope
CREATE TYPE public.permission_scope AS ENUM ('all', 'team', 'own', 'assigned');

-- =====================================================
-- TABLE: roles
-- Stores all available roles in the system
-- =====================================================
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  is_system BOOLEAN DEFAULT false,
  is_editable BOOLEAN DEFAULT true,
  hierarchy_level INT DEFAULT 0,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_roles_org ON public.roles(organization_id);
CREATE INDEX idx_roles_code ON public.roles(code);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: permission_definitions
-- Master list of all available permissions
-- =====================================================
CREATE TABLE public.permission_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  action permission_action NOT NULL,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_perm_def_module ON public.permission_definitions(module);
CREATE INDEX idx_perm_def_code ON public.permission_definitions(code);

-- Enable RLS
ALTER TABLE public.permission_definitions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: role_permissions
-- Maps permissions to roles
-- =====================================================
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,
  scope permission_scope DEFAULT 'all',
  conditions JSONB DEFAULT '{}',
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES public.users(id),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_perms_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_perms_perm ON public.role_permissions(permission_id);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: teams
-- Teams within an organization
-- =====================================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  leader_id UUID REFERENCES public.users(id),
  parent_team_id UUID REFERENCES public.teams(id),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_teams_org ON public.teams(organization_id);
CREATE INDEX idx_teams_parent ON public.teams(parent_team_id);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: team_members
-- Maps users to teams
-- =====================================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_in_team TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: resource_permissions
-- Direct permission grants on specific resources
-- =====================================================
CREATE TABLE public.resource_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  grantee_type TEXT NOT NULL,
  grantee_id UUID NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMPTZ,
  UNIQUE(resource_type, resource_id, grantee_type, grantee_id, permission_id)
);

CREATE INDEX idx_res_perms_resource ON public.resource_permissions(resource_type, resource_id);
CREATE INDEX idx_res_perms_grantee ON public.resource_permissions(grantee_type, grantee_id);
CREATE INDEX idx_res_perms_org ON public.resource_permissions(organization_id);

-- Enable RLS
ALTER TABLE public.resource_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: access_audit_log
-- Logs all permission checks and access attempts
-- =====================================================
CREATE TABLE public.access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  permission_code TEXT,
  granted BOOLEAN NOT NULL,
  denial_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_org ON public.access_audit_log(organization_id);
CREATE INDEX idx_audit_user ON public.access_audit_log(user_id);
CREATE INDEX idx_audit_created ON public.access_audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON public.access_audit_log(action);

-- Enable RLS
ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLE: user_sessions
-- Tracks active user sessions
-- =====================================================
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_sessions_active ON public.user_sessions(is_active, expires_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADD role_id TO memberships (NULLABLE for migration)
-- =====================================================
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);
CREATE INDEX IF NOT EXISTS idx_memberships_role_id ON public.memberships(role_id);

-- =====================================================
-- INSERT: System Roles (with fixed UUIDs)
-- =====================================================
INSERT INTO public.roles (id, name, code, description, color, is_system, is_editable, hierarchy_level, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Propietario', 'owner', 'Control total de la organización. Puede eliminar la organización y gestionar facturación.', '#EF4444', true, false, 100, NULL),
  ('00000000-0000-0000-0000-000000000002', 'Administrador', 'admin', 'Gestión completa excepto facturación y eliminación de organización.', '#F59E0B', true, false, 90, NULL),
  ('00000000-0000-0000-0000-000000000003', 'Gestor', 'manager', 'Gestión de expedientes, CRM y equipo. Sin configuración avanzada.', '#3B82F6', true, true, 70, NULL),
  ('00000000-0000-0000-0000-000000000004', 'Miembro', 'member', 'Trabajo diario con expedientes y CRM asignados.', '#10B981', true, true, 50, NULL),
  ('00000000-0000-0000-0000-000000000005', 'Visor', 'viewer', 'Solo lectura. Puede ver pero no modificar.', '#6B7280', true, true, 20, NULL),
  ('00000000-0000-0000-0000-000000000006', 'Cliente Externo', 'external', 'Acceso al portal de cliente. Ve solo sus expedientes.', '#8B5CF6', true, true, 10, NULL);

-- =====================================================
-- INSERT: Permission Definitions (50+ permissions)
-- =====================================================

-- DASHBOARD permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('dashboard.view', 'Ver Dashboard', 'Ver el panel principal', 'dashboard', 'view'),
  ('dashboard.configure', 'Configurar Dashboard', 'Personalizar widgets y layout', 'dashboard', 'configure'),
  ('dashboard.export', 'Exportar datos Dashboard', 'Exportar métricas y reportes', 'dashboard', 'export');

-- DOCKET (Expedientes) permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('docket.view', 'Ver Expedientes', 'Ver lista y detalles de expedientes', 'docket', 'view'),
  ('docket.create', 'Crear Expedientes', 'Crear nuevos expedientes', 'docket', 'create'),
  ('docket.edit', 'Editar Expedientes', 'Modificar expedientes existentes', 'docket', 'edit'),
  ('docket.delete', 'Eliminar Expedientes', 'Eliminar expedientes', 'docket', 'delete'),
  ('docket.export', 'Exportar Expedientes', 'Exportar datos de expedientes', 'docket', 'export'),
  ('docket.configure', 'Configurar Docket', 'Configurar tipos, estados, campos custom', 'docket', 'configure');

-- CRM permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('crm.view', 'Ver CRM', 'Ver contactos y deals', 'crm', 'view'),
  ('crm.create', 'Crear en CRM', 'Crear contactos y deals', 'crm', 'create'),
  ('crm.edit', 'Editar CRM', 'Modificar contactos y deals', 'crm', 'edit'),
  ('crm.delete', 'Eliminar en CRM', 'Eliminar contactos y deals', 'crm', 'delete'),
  ('crm.export', 'Exportar CRM', 'Exportar datos del CRM', 'crm', 'export'),
  ('crm.configure', 'Configurar CRM', 'Configurar pipelines, campos, etc', 'crm', 'configure');

-- SPIDER (Vigilancia) permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('spider.view', 'Ver Vigilancia', 'Ver alertas y búsquedas', 'spider', 'view'),
  ('spider.create', 'Crear Vigilancias', 'Crear nuevas vigilancias', 'spider', 'create'),
  ('spider.edit', 'Editar Vigilancias', 'Modificar vigilancias existentes', 'spider', 'edit'),
  ('spider.delete', 'Eliminar Vigilancias', 'Eliminar vigilancias', 'spider', 'delete'),
  ('spider.configure', 'Configurar Spider', 'Configurar fuentes y reglas', 'spider', 'configure');

-- FINANCE permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('finance.view', 'Ver Finanzas', 'Ver facturas y costes', 'finance', 'view'),
  ('finance.create', 'Crear Finanzas', 'Crear facturas y registros', 'finance', 'create'),
  ('finance.edit', 'Editar Finanzas', 'Modificar registros financieros', 'finance', 'edit'),
  ('finance.delete', 'Eliminar Finanzas', 'Eliminar registros financieros', 'finance', 'delete'),
  ('finance.export', 'Exportar Finanzas', 'Exportar datos financieros', 'finance', 'export'),
  ('finance.approve', 'Aprobar Finanzas', 'Aprobar facturas y pagos', 'finance', 'approve'),
  ('finance.configure', 'Configurar Finanzas', 'Configurar impuestos, tasas, etc', 'finance', 'configure');

-- MARKETING permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('marketing.view', 'Ver Marketing', 'Ver campañas y métricas', 'marketing', 'view'),
  ('marketing.create', 'Crear Campañas', 'Crear campañas de email', 'marketing', 'create'),
  ('marketing.edit', 'Editar Campañas', 'Modificar campañas', 'marketing', 'edit'),
  ('marketing.delete', 'Eliminar Campañas', 'Eliminar campañas', 'marketing', 'delete'),
  ('marketing.configure', 'Configurar Marketing', 'Configurar templates y listas', 'marketing', 'configure');

-- GENIUS (AI) permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('genius.view', 'Usar Genius', 'Acceder a funciones de IA', 'genius', 'view'),
  ('genius.create', 'Generar con IA', 'Generar documentos y análisis', 'genius', 'create'),
  ('genius.configure', 'Configurar Genius', 'Configurar modelos y límites', 'genius', 'configure');

-- MARKET permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('market.view', 'Ver Market', 'Ver marketplace', 'market', 'view'),
  ('market.create', 'Publicar en Market', 'Publicar servicios', 'market', 'create'),
  ('market.manage', 'Gestionar Market', 'Gestionar publicaciones', 'market', 'manage');

-- DATA HUB permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('datahub.view', 'Ver Data Hub', 'Ver conectores y sincronizaciones', 'datahub', 'view'),
  ('datahub.configure', 'Configurar Data Hub', 'Configurar conectores', 'datahub', 'configure');

-- TEAM (Users & Roles) permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('team.view', 'Ver Equipo', 'Ver miembros del equipo', 'team', 'view'),
  ('team.create', 'Invitar Miembros', 'Invitar nuevos miembros', 'team', 'create'),
  ('team.edit', 'Editar Miembros', 'Cambiar roles de miembros', 'team', 'edit'),
  ('team.delete', 'Eliminar Miembros', 'Eliminar miembros del equipo', 'team', 'delete'),
  ('team.manage', 'Gestionar Equipos', 'Crear y gestionar equipos', 'team', 'manage');

-- ROLES permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('roles.view', 'Ver Roles', 'Ver roles disponibles', 'roles', 'view'),
  ('roles.create', 'Crear Roles', 'Crear roles personalizados', 'roles', 'create'),
  ('roles.edit', 'Editar Roles', 'Modificar permisos de roles', 'roles', 'edit'),
  ('roles.delete', 'Eliminar Roles', 'Eliminar roles personalizados', 'roles', 'delete');

-- ORGANIZATION permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('org.view', 'Ver Organización', 'Ver datos de la organización', 'org', 'view'),
  ('org.edit', 'Editar Organización', 'Modificar datos de la organización', 'org', 'edit'),
  ('org.configure', 'Configurar Organización', 'Configurar ajustes avanzados', 'org', 'configure'),
  ('org.delete', 'Eliminar Organización', 'Eliminar la organización', 'org', 'delete'),
  ('org.billing', 'Gestionar Facturación', 'Ver y gestionar suscripción', 'org', 'manage');

-- API permissions
INSERT INTO public.permission_definitions (code, name, description, module, action) VALUES
  ('api.view', 'Ver API', 'Ver claves de API', 'api', 'view'),
  ('api.create', 'Crear API Keys', 'Crear claves de API', 'api', 'create'),
  ('api.delete', 'Eliminar API Keys', 'Eliminar claves de API', 'api', 'delete');

-- =====================================================
-- INSERT: Role-Permission Mappings
-- =====================================================

-- OWNER: All permissions
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  id,
  'all'::permission_scope
FROM public.permission_definitions;

-- ADMIN: All except org.delete and org.billing
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid,
  id,
  'all'::permission_scope
FROM public.permission_definitions
WHERE code NOT IN ('org.delete', 'org.billing');

-- MANAGER: Operational permissions
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 
  '00000000-0000-0000-0000-000000000003'::uuid,
  id,
  'all'::permission_scope
FROM public.permission_definitions
WHERE code IN (
  'dashboard.view', 'dashboard.export',
  'docket.view', 'docket.create', 'docket.edit', 'docket.delete', 'docket.export',
  'crm.view', 'crm.create', 'crm.edit', 'crm.delete', 'crm.export',
  'spider.view', 'spider.create', 'spider.edit', 'spider.delete',
  'finance.view', 'finance.create', 'finance.edit', 'finance.export',
  'marketing.view', 'marketing.create', 'marketing.edit',
  'genius.view', 'genius.create',
  'market.view',
  'datahub.view',
  'team.view', 'team.create', 'team.edit',
  'roles.view',
  'org.view',
  'api.view'
);

-- MEMBER: Work on assigned items
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 
  '00000000-0000-0000-0000-000000000004'::uuid,
  id,
  CASE 
    WHEN code LIKE 'docket.%' OR code LIKE 'crm.%' THEN 'assigned'::permission_scope
    ELSE 'own'::permission_scope
  END
FROM public.permission_definitions
WHERE code IN (
  'dashboard.view',
  'docket.view', 'docket.create', 'docket.edit',
  'crm.view', 'crm.create', 'crm.edit',
  'spider.view',
  'finance.view',
  'genius.view', 'genius.create',
  'market.view',
  'team.view',
  'org.view'
);

-- VIEWER: Read-only
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 
  '00000000-0000-0000-0000-000000000005'::uuid,
  id,
  'all'::permission_scope
FROM public.permission_definitions
WHERE code IN (
  'dashboard.view',
  'docket.view',
  'crm.view',
  'spider.view',
  'finance.view',
  'market.view',
  'team.view',
  'org.view'
);

-- EXTERNAL: Client portal only
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 
  '00000000-0000-0000-0000-000000000006'::uuid,
  id,
  'own'::permission_scope
FROM public.permission_definitions
WHERE code IN (
  'docket.view',
  'finance.view'
);

-- =====================================================
-- SECURITY DEFINER FUNCTION: Check user permission
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_user_permission(
  _user_id UUID,
  _organization_id UUID,
  _permission_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_permission BOOLEAN := false;
  _legacy_role TEXT;
BEGIN
  -- First, try the new system (role_id)
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    JOIN role_permissions rp ON rp.role_id = m.role_id
    JOIN permission_definitions pd ON pd.id = rp.permission_id
    WHERE m.user_id = _user_id
      AND m.organization_id = _organization_id
      AND pd.code = _permission_code
  ) INTO _has_permission;
  
  IF _has_permission THEN
    RETURN true;
  END IF;
  
  -- Fallback to legacy role string
  SELECT role INTO _legacy_role
  FROM memberships
  WHERE user_id = _user_id AND organization_id = _organization_id;
  
  IF _legacy_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Map legacy roles to permissions
  CASE _legacy_role
    WHEN 'owner' THEN
      RETURN true; -- Owner has all permissions
    WHEN 'admin' THEN
      RETURN _permission_code NOT IN ('org.delete', 'org.billing');
    WHEN 'manager' THEN
      RETURN _permission_code IN (
        'dashboard.view', 'dashboard.export',
        'docket.view', 'docket.create', 'docket.edit', 'docket.delete', 'docket.export',
        'crm.view', 'crm.create', 'crm.edit', 'crm.delete', 'crm.export',
        'spider.view', 'spider.create', 'spider.edit', 'spider.delete',
        'finance.view', 'finance.create', 'finance.edit', 'finance.export',
        'marketing.view', 'marketing.create', 'marketing.edit',
        'genius.view', 'genius.create',
        'market.view', 'datahub.view',
        'team.view', 'team.create', 'team.edit',
        'roles.view', 'org.view', 'api.view'
      );
    WHEN 'member' THEN
      RETURN _permission_code IN (
        'dashboard.view',
        'docket.view', 'docket.create', 'docket.edit',
        'crm.view', 'crm.create', 'crm.edit',
        'spider.view', 'finance.view',
        'genius.view', 'genius.create',
        'market.view', 'team.view', 'org.view'
      );
    WHEN 'viewer' THEN
      RETURN _permission_code IN (
        'dashboard.view', 'docket.view', 'crm.view',
        'spider.view', 'finance.view', 'market.view',
        'team.view', 'org.view'
      );
    WHEN 'external' THEN
      RETURN _permission_code IN ('docket.view', 'finance.view');
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- =====================================================
-- SECURITY DEFINER FUNCTION: Get user role
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_role(
  _user_id UUID,
  _organization_id UUID
)
RETURNS TABLE(
  role_id UUID,
  role_code TEXT,
  role_name TEXT,
  legacy_role TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as role_id,
    r.code as role_code,
    r.name as role_name,
    m.role as legacy_role
  FROM memberships m
  LEFT JOIN roles r ON r.id = m.role_id
  WHERE m.user_id = _user_id 
    AND m.organization_id = _organization_id;
END;
$$;

-- =====================================================
-- FUNCTION: Get all user permissions
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_permissions(
  _user_id UUID,
  _organization_id UUID
)
RETURNS TABLE(
  permission_code TEXT,
  permission_name TEXT,
  module TEXT,
  scope permission_scope
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_id UUID;
  _legacy_role TEXT;
BEGIN
  -- Get role_id and legacy role
  SELECT m.role_id, m.role INTO _role_id, _legacy_role
  FROM memberships m
  WHERE m.user_id = _user_id AND m.organization_id = _organization_id;
  
  -- If new system
  IF _role_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      pd.code,
      pd.name,
      pd.module,
      rp.scope
    FROM role_permissions rp
    JOIN permission_definitions pd ON pd.id = rp.permission_id
    WHERE rp.role_id = _role_id;
  ELSE
    -- Fallback: Return permissions based on legacy role
    RETURN QUERY
    SELECT 
      pd.code,
      pd.name,
      pd.module,
      'all'::permission_scope
    FROM permission_definitions pd
    WHERE 
      (_legacy_role = 'owner') OR
      (_legacy_role = 'admin' AND pd.code NOT IN ('org.delete', 'org.billing')) OR
      (_legacy_role = 'manager' AND pd.code IN (
        'dashboard.view', 'dashboard.export',
        'docket.view', 'docket.create', 'docket.edit', 'docket.delete', 'docket.export',
        'crm.view', 'crm.create', 'crm.edit', 'crm.delete', 'crm.export',
        'spider.view', 'spider.create', 'spider.edit', 'spider.delete',
        'finance.view', 'finance.create', 'finance.edit', 'finance.export',
        'marketing.view', 'marketing.create', 'marketing.edit',
        'genius.view', 'genius.create',
        'market.view', 'datahub.view',
        'team.view', 'team.create', 'team.edit',
        'roles.view', 'org.view', 'api.view'
      )) OR
      (_legacy_role = 'member' AND pd.code IN (
        'dashboard.view',
        'docket.view', 'docket.create', 'docket.edit',
        'crm.view', 'crm.create', 'crm.edit',
        'spider.view', 'finance.view',
        'genius.view', 'genius.create',
        'market.view', 'team.view', 'org.view'
      )) OR
      (_legacy_role = 'viewer' AND pd.code IN (
        'dashboard.view', 'docket.view', 'crm.view',
        'spider.view', 'finance.view', 'market.view',
        'team.view', 'org.view'
      )) OR
      (_legacy_role = 'external' AND pd.code IN ('docket.view', 'finance.view'));
  END IF;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Roles: Viewable by authenticated users in same org
CREATE POLICY "Users can view system roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.user_id = auth.uid()
        AND memberships.organization_id = roles.organization_id
    )
  );

CREATE POLICY "Admins can manage org roles"
  ON public.roles FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT NULL AND
    public.check_user_permission(auth.uid(), organization_id, 'roles.edit')
  );

-- Permission definitions: Viewable by all authenticated
CREATE POLICY "Anyone can view permissions"
  ON public.permission_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Role permissions: Viewable by all authenticated
CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Teams: Managed by org members
CREATE POLICY "Org members can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.user_id = auth.uid()
        AND memberships.organization_id = teams.organization_id
    )
  );

CREATE POLICY "Managers can manage teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (
    public.check_user_permission(auth.uid(), organization_id, 'team.manage')
  );

-- Team members: Viewable by org members
CREATE POLICY "Org members can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN memberships m ON m.organization_id = t.organization_id
      WHERE t.id = team_members.team_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
        AND public.check_user_permission(auth.uid(), t.organization_id, 'team.manage')
    )
  );

-- Resource permissions: Managed by those with access
CREATE POLICY "View resource permissions for own org"
  ON public.resource_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.user_id = auth.uid()
        AND memberships.organization_id = resource_permissions.organization_id
    )
  );

-- Access audit log: Viewable by admins
CREATE POLICY "Admins can view audit logs"
  ON public.access_audit_log FOR SELECT
  TO authenticated
  USING (
    public.check_user_permission(auth.uid(), organization_id, 'org.configure')
  );

CREATE POLICY "System can insert audit logs"
  ON public.access_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User sessions: Users can see their own
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own sessions"
  ON public.user_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGER: Update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_rbac_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_rbac_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_rbac_updated_at();