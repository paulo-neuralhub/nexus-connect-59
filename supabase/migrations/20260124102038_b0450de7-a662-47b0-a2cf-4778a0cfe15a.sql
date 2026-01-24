-- L39a-STORAGE: Configuración completa de buckets y tabla documents

-- ============================================
-- 1. CREAR STORAGE BUCKETS
-- ============================================

-- Bucket: matter-documents (documentos de expedientes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'matter-documents', 
  'matter-documents', 
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: client-documents (documentos de clientes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents', 
  'client-documents', 
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: logos (logos de marcas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos', 
  'logos', 
  true, -- Público para mostrar en UI
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: invoices (facturas PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices', 
  'invoices', 
  false,
  20971520, -- 20MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Bucket: templates (templates de documentos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates', 
  'templates', 
  false,
  20971520,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/html']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. RLS POLICIES PARA STORAGE
-- ============================================

-- Helper function para verificar membresía en org (desde path)
CREATE OR REPLACE FUNCTION public.user_has_org_access_from_path(bucket_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  path_parts TEXT[];
BEGIN
  -- Extraer org_id del path (primer segmento)
  path_parts := string_to_array(bucket_path, '/');
  IF array_length(path_parts, 1) < 1 THEN
    RETURN FALSE;
  END IF;
  
  BEGIN
    org_id := path_parts[1]::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = org_id
      AND m.user_id = auth.uid()
  );
END;
$$;

-- ============================================
-- Políticas para matter-documents
-- ============================================
DROP POLICY IF EXISTS "matter_docs_select" ON storage.objects;
CREATE POLICY "matter_docs_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'matter-documents' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "matter_docs_insert" ON storage.objects;
CREATE POLICY "matter_docs_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'matter-documents' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "matter_docs_update" ON storage.objects;
CREATE POLICY "matter_docs_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'matter-documents' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "matter_docs_delete" ON storage.objects;
CREATE POLICY "matter_docs_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'matter-documents' 
  AND public.user_has_org_access_from_path(name)
);

-- ============================================
-- Políticas para client-documents
-- ============================================
DROP POLICY IF EXISTS "client_docs_select" ON storage.objects;
CREATE POLICY "client_docs_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "client_docs_insert" ON storage.objects;
CREATE POLICY "client_docs_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "client_docs_update" ON storage.objects;
CREATE POLICY "client_docs_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "client_docs_delete" ON storage.objects;
CREATE POLICY "client_docs_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND public.user_has_org_access_from_path(name)
);

-- ============================================
-- Políticas para logos (público para lectura)
-- ============================================
DROP POLICY IF EXISTS "logos_select_public" ON storage.objects;
CREATE POLICY "logos_select_public" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "logos_insert" ON storage.objects;
CREATE POLICY "logos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "logos_update" ON storage.objects;
CREATE POLICY "logos_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "logos_delete" ON storage.objects;
CREATE POLICY "logos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'logos' 
  AND public.user_has_org_access_from_path(name)
);

-- ============================================
-- Políticas para invoices
-- ============================================
DROP POLICY IF EXISTS "invoices_select" ON storage.objects;
CREATE POLICY "invoices_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'invoices' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "invoices_insert" ON storage.objects;
CREATE POLICY "invoices_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoices' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "invoices_update" ON storage.objects;
CREATE POLICY "invoices_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'invoices' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "invoices_delete" ON storage.objects;
CREATE POLICY "invoices_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'invoices' 
  AND public.user_has_org_access_from_path(name)
);

-- ============================================
-- Políticas para templates
-- ============================================
DROP POLICY IF EXISTS "templates_select" ON storage.objects;
CREATE POLICY "templates_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'templates' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "templates_insert" ON storage.objects;
CREATE POLICY "templates_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'templates' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "templates_update" ON storage.objects;
CREATE POLICY "templates_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'templates' 
  AND public.user_has_org_access_from_path(name)
);

DROP POLICY IF EXISTS "templates_delete" ON storage.objects;
CREATE POLICY "templates_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'templates' 
  AND public.user_has_org_access_from_path(name)
);

-- ============================================
-- 3. CREAR/MEJORAR TABLA DOCUMENTS
-- ============================================

-- Crear tipo enum para document_type
DO $$ BEGIN
  CREATE TYPE public.document_type_enum AS ENUM (
    'application',
    'certificate', 
    'logo',
    'correspondence',
    'invoice',
    'contract',
    'power_of_attorney',
    'search_report',
    'office_action',
    'response',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Crear tabla documents si no existe, o añadir columnas
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  storage_bucket VARCHAR(50) NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  document_type public.document_type_enum DEFAULT 'other',
  title VARCHAR(255),
  description TEXT,
  version INTEGER DEFAULT 1,
  is_current_version BOOLEAN DEFAULT true,
  previous_version_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_storage_path UNIQUE (storage_bucket, storage_path)
);

-- Índices para documents
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_matter ON public.documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_current ON public.documents(is_current_version) WHERE is_current_version = true;

-- ============================================
-- 4. RLS PARA DOCUMENTS
-- ============================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT m.organization_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT m.organization_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents
FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT m.organization_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete" ON public.documents
FOR DELETE TO authenticated
USING (
  organization_id IN (
    SELECT m.organization_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

-- ============================================
-- 5. TRIGGER: Actualizar matter.updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_matter_on_document_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.matter_id IS NOT NULL THEN
    UPDATE public.matters 
    SET updated_at = now() 
    WHERE id = NEW.matter_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_update_matter ON public.documents;
CREATE TRIGGER trg_document_update_matter
AFTER INSERT OR UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_matter_on_document_change();

-- ============================================
-- 6. TRIGGER: Auto-update updated_at
-- ============================================

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();