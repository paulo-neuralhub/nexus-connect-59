-- =============================================
-- L42a: Client Relationships Model
-- =============================================

-- 1. Add new columns to contacts table for client types and hierarchy
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'company' 
  CHECK (client_type IN ('company', 'individual', 'agent', 'representative')),
ADD COLUMN IF NOT EXISTS parent_client_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_billing_contact BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_primary_contact BOOLEAN DEFAULT false;

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_contacts_parent_client_id ON public.contacts(parent_client_id) WHERE parent_client_id IS NOT NULL;

-- 2. Create client_relationships table
CREATE TABLE public.client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  related_client_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'representative',
    'agent',
    'partner',
    'subsidiary',
    'parent_company',
    'licensee',
    'licensor',
    'contact',
    'referral',
    'other'
  )),
  relationship_label VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent self-relationships
  CONSTRAINT no_self_relationship CHECK (client_id <> related_client_id),
  -- Unique constraint for relationship type between two clients
  CONSTRAINT unique_client_relationship UNIQUE (client_id, related_client_id, relationship_type)
);

-- Indexes for efficient querying
CREATE INDEX idx_client_relationships_org ON public.client_relationships(organization_id);
CREATE INDEX idx_client_relationships_client ON public.client_relationships(client_id);
CREATE INDEX idx_client_relationships_related ON public.client_relationships(related_client_id);
CREATE INDEX idx_client_relationships_type ON public.client_relationships(relationship_type);
CREATE INDEX idx_client_relationships_validity ON public.client_relationships(valid_from, valid_until) 
  WHERE valid_from IS NOT NULL OR valid_until IS NOT NULL;

-- 3. Enable RLS
ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view relationships in their organization"
  ON public.client_relationships
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create relationships in their organization"
  ON public.client_relationships
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update relationships in their organization"
  ON public.client_relationships
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete relationships in their organization"
  ON public.client_relationships
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- 5. Trigger for updated_at
CREATE TRIGGER update_client_relationships_updated_at
  BEFORE UPDATE ON public.client_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Helper function to get inverse relationship type
CREATE OR REPLACE FUNCTION public.get_inverse_relationship_type(rel_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE rel_type
    WHEN 'subsidiary' THEN 'parent_company'
    WHEN 'parent_company' THEN 'subsidiary'
    WHEN 'licensee' THEN 'licensor'
    WHEN 'licensor' THEN 'licensee'
    WHEN 'referral' THEN 'referral'
    ELSE rel_type
  END;
END;
$$;

-- 7. Comment documentation
COMMENT ON TABLE public.client_relationships IS 'Tracks relationships between clients (companies, individuals, agents, etc.)';
COMMENT ON COLUMN public.client_relationships.relationship_type IS 'Type of relationship: representative, agent, partner, subsidiary, parent_company, licensee, licensor, contact, referral, other';
COMMENT ON COLUMN public.client_relationships.is_primary IS 'Whether this is the primary relationship of this type for the client';
COMMENT ON COLUMN public.client_relationships.valid_from IS 'Start date of the relationship validity period';
COMMENT ON COLUMN public.client_relationships.valid_until IS 'End date of the relationship validity period (null = ongoing)';