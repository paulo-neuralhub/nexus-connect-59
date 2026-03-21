
-- =============================================
-- MARKET-01 v3 — Complete IP-MARKET Schema
-- Order: Functions → Base Tables → Extension Tables → RLS → Indexes → Triggers → Seed
-- =============================================

-- =============================================
-- 1. FUNCTIONS
-- =============================================

-- slugify: generic text-to-slug
CREATE OR REPLACE FUNCTION public.slugify(input_text text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT
AS $$
DECLARE
  slug text;
BEGIN
  slug := lower(trim(input_text));
  slug := translate(slug,
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiioooooouuuuncaaaaaeeeeiiiioooooouuuunc');
  slug := regexp_replace(slug, '[^a-z0-9\-]', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$;

-- generate_agent_slug: unique slug for market_agents
CREATE OR REPLACE FUNCTION public.generate_agent_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  base_slug := public.slugify(COALESCE(NEW.display_name, NEW.firm_name, 'agent'));

  final_slug := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.market_agents WHERE slug = final_slug AND id != NEW.id
    );
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- update_agent_metrics: recalculate agent stats from reviews
CREATE OR REPLACE FUNCTION public.update_agent_metrics()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_agent_id uuid;
  v_avg numeric(3,2);
  v_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_agent_id := OLD.agent_id;
  ELSE
    v_agent_id := NEW.agent_id;
  END IF;

  SELECT
    COALESCE(AVG(overall_rating), 0),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.market_reviews
  WHERE agent_id = v_agent_id
    AND status = 'published';

  UPDATE public.market_agents
  SET rating_avg = v_avg,
      ratings_count = v_count,
      updated_at = now()
  WHERE id = v_agent_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =============================================
-- 2. BASE TABLES
-- =============================================

-- market_agents: agent profiles in the marketplace
CREATE TABLE IF NOT EXISTS public.market_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,

  -- Identity
  display_name text NOT NULL,
  firm_name text,
  slug text UNIQUE,
  bio text,
  avatar_url text,
  cover_image_url text,
  website text,
  linkedin_url text,

  -- Location
  country_code text NOT NULL DEFAULT 'ES',
  city text,
  timezone text DEFAULT 'Europe/Madrid',

  -- Professional
  jurisdictions text[] DEFAULT '{}',
  specializations text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  license_number text,
  bar_association text,

  -- Marketplace config
  market_plan text DEFAULT 'free' CHECK (market_plan IN ('free','verified','pro','premium')),
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  accepts_new_clients boolean DEFAULT true,

  -- Stripe Connect
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  stripe_charges_enabled boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,

  -- Metrics (denormalized, updated by trigger)
  rating_avg numeric(3,2) DEFAULT 0,
  ratings_count integer DEFAULT 0,
  completed_services integer DEFAULT 0,
  success_rate numeric(5,2) DEFAULT 0,
  avg_response_hours numeric(6,2),
  reputation_score numeric(6,2) DEFAULT 0,

  -- Revision policy
  default_revisions_included integer DEFAULT 2,
  extra_revision_fee_eur numeric(10,2) DEFAULT 50,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- market_agent_services: services offered by each agent
CREATE TABLE IF NOT EXISTS public.market_agent_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.market_agents(id) ON DELETE CASCADE,

  service_type text NOT NULL,
  -- 'trademark_registration','patent_registration','design_registration',
  -- 'opposition','prior_art_search','renewal','surveillance','legal_opinion','search'

  jurisdiction_code text NOT NULL,
  title text,
  description text,

  -- Pricing
  base_price_eur numeric(10,2),
  official_fees_eur numeric(10,2) DEFAULT 0,
  price_includes_official_fees boolean DEFAULT false,
  additional_class_fee_eur numeric(10,2),
  currency text DEFAULT 'EUR',

  -- Payment plans offered by this agent for this service
  available_payment_plans text[] DEFAULT '{single,two_phase}',
  -- subset of: single, two_phase, milestone, subscription

  -- Delivery
  estimated_days_min integer,
  estimated_days_max integer,
  revisions_included integer DEFAULT 2,

  -- What's included
  includes text[] DEFAULT '{}',
  excludes text[] DEFAULT '{}',

  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(agent_id, service_type, jurisdiction_code)
);

-- market_agent_portfolio: showcase of past work
CREATE TABLE IF NOT EXISTS public.market_agent_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.market_agents(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  service_type text,
  jurisdiction_code text,
  outcome text, -- 'registered','granted','won','settled'
  year integer,
  image_url text,
  is_public boolean DEFAULT true,

  created_at timestamptz DEFAULT now()
);

-- market_service_requests: the core transaction entity
CREATE TABLE IF NOT EXISTS public.market_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE,

  -- Parties
  client_user_id uuid NOT NULL REFERENCES auth.users(id),
  client_organization_id uuid REFERENCES public.organizations(id),
  agent_id uuid REFERENCES public.market_agents(id),

  -- Service details
  service_type text NOT NULL,
  jurisdiction_code text NOT NULL,
  title text NOT NULL,
  description text,
  brand_name text,
  nice_classes integer[] DEFAULT '{}',
  urgency text DEFAULT 'normal' CHECK (urgency IN ('normal','urgent','flexible')),

  -- Status workflow
  status text DEFAULT 'draft' CHECK (status IN (
    'draft','published','quoted','accepted','in_progress',
    'delivered','revision_requested','completed',
    'cancelled','disputed','refunded'
  )),
  status_changed_at timestamptz DEFAULT now(),

  -- Payment plan (v3)
  payment_plan text DEFAULT 'single' CHECK (payment_plan IN (
    'single','two_phase','milestone','subscription'
  )),

  -- Milestones (v3, JSONB array)
  milestones jsonb DEFAULT '[]',

  -- Budget breakdown (v3)
  official_fees_total_eur numeric(10,2) DEFAULT 0,
  professional_fees_total_eur numeric(10,2) DEFAULT 0,
  total_amount_eur numeric(10,2) DEFAULT 0,
  platform_fee_eur numeric(10,2) DEFAULT 0,
  agent_payout_eur numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'EUR',

  -- Payment
  payment_status text DEFAULT 'pending' CHECK (payment_status IN (
    'pending','partially_paid','paid','held','released',
    'frozen','refunded','partially_refunded'
  )),
  stripe_payment_intent_id text,
  stripe_transfer_group text,

  -- Delivery
  estimated_days integer,
  deadline_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  auto_release_at timestamptz,

  delivery_evidence_required boolean DEFAULT true,
  delivery_files jsonb DEFAULT '[]',
  delivery_notes text,

  -- Revisions (v3)
  revisions_included integer DEFAULT 2,
  revisions_used integer DEFAULT 0,

  -- Resolution center (v3)
  resolution_center_opened_at timestamptz,
  resolution_center_initiated_by text,
  resolution_center_action text,
  resolution_center_response_deadline timestamptz,
  resolution_center_resolved boolean DEFAULT false,

  -- Quote
  quote_amount_eur numeric(10,2),
  quote_notes text,
  quote_sent_at timestamptz,
  quote_accepted_at timestamptz,
  quote_rejected_at timestamptz,
  quote_valid_until timestamptz,

  -- Communication
  comm_thread_id uuid,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- market_reviews: verified reviews from completed transactions
CREATE TABLE IF NOT EXISTS public.market_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES public.market_service_requests(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.market_agents(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES auth.users(id),

  -- Ratings (1-5)
  overall_rating integer NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  communication_rating integer CHECK (communication_rating BETWEEN 1 AND 5),
  quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
  timeliness_rating integer CHECK (timeliness_rating BETWEEN 1 AND 5),
  value_rating integer CHECK (value_rating BETWEEN 1 AND 5),
  expertise_rating integer CHECK (expertise_rating BETWEEN 1 AND 5),

  -- Content
  review_text text,
  review_language text DEFAULT 'es',

  -- Agent reply
  agent_reply text,
  agent_reply_at timestamptz,

  -- Moderation
  status text DEFAULT 'pending_moderation' CHECK (status IN (
    'pending_moderation','published','rejected','hidden'
  )),
  moderated_by uuid,
  moderated_at timestamptz,
  rejection_reason text,

  -- Privacy
  is_anonymous boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One review per completed service request
  UNIQUE(service_request_id)
);

-- market_agent_credentials: verified credentials / certifications
CREATE TABLE IF NOT EXISTS public.market_agent_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.market_agents(id) ON DELETE CASCADE,

  credential_type text NOT NULL,
  -- 'bar_membership','euipo_rep','uspto_reg','patent_attorney','certified_mediator'
  credential_name text NOT NULL,
  issuing_authority text,
  credential_number text,
  issued_at date,
  expires_at date,

  -- Verification
  document_storage_path text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid,

  created_at timestamptz DEFAULT now()
);

-- market_saved_agents: client favorites / bookmarks
CREATE TABLE IF NOT EXISTS public.market_saved_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.market_agents(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- =============================================
-- 3. EXTENSION TABLES (v3)
-- =============================================

-- market_milestone_events: immutable log of milestone lifecycle
CREATE TABLE IF NOT EXISTS public.market_milestone_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES public.market_service_requests(id) ON DELETE CASCADE,
  milestone_number integer NOT NULL,
  event_type text NOT NULL,
  -- 'funded','work_started','evidence_uploaded',
  -- 'revision_requested','revision_completed',
  -- 'client_confirmed','auto_released',
  -- 'auto_release_blocked_no_evidence',
  -- 'dispute_opened','dispute_resolved','refunded'
  event_data jsonb DEFAULT '{}',
  performed_by uuid REFERENCES auth.users(id),
  performed_by_type text, -- 'client','agent','system','admin'
  created_at timestamptz DEFAULT now()
  -- IMMUTABLE: no updated_at
);

-- market_official_fee_receipts: proof of official fee payments
CREATE TABLE IF NOT EXISTS public.market_official_fee_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES public.market_service_requests(id) ON DELETE CASCADE,
  milestone_number integer,

  office_code text NOT NULL, -- 'EUIPO','USPTO','OEPM', etc.
  office_name text,

  receipt_reference text,
  amount_paid numeric(10,2) NOT NULL,
  amount_currency text DEFAULT 'EUR',
  paid_at date NOT NULL,

  receipt_storage_path text NOT NULL,

  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id),

  created_at timestamptz DEFAULT now()
);

-- market_price_regulations: jurisdiction price display rules
CREATE TABLE IF NOT EXISTS public.market_price_regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code text NOT NULL UNIQUE,
  jurisdiction_name text NOT NULL,

  price_display_allowed boolean DEFAULT true,
  price_regulation_type text DEFAULT 'free',
  -- 'free','reference_only','mandatory_estimate','restricted'
  legal_basis text,
  price_display_note text,

  last_verified_at date DEFAULT CURRENT_DATE,
  source_url text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 4. RLS
-- =============================================

ALTER TABLE public.market_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_agent_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_agent_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_agent_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_saved_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_milestone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_official_fee_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_regulations ENABLE ROW LEVEL SECURITY;

-- market_agents: public read for active agents, owner write
CREATE POLICY "market_agents_public_read" ON public.market_agents
  FOR SELECT USING (is_active = true);

CREATE POLICY "market_agents_owner_insert" ON public.market_agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "market_agents_owner_update" ON public.market_agents
  FOR UPDATE USING (auth.uid() = user_id);

-- market_agent_services: public read, owner write
CREATE POLICY "market_agent_services_public_read" ON public.market_agent_services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND is_active = true)
  );

CREATE POLICY "market_agent_services_owner_write" ON public.market_agent_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- market_agent_portfolio: public read, owner write
CREATE POLICY "market_agent_portfolio_public_read" ON public.market_agent_portfolio
  FOR SELECT USING (
    is_public = true AND
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND is_active = true)
  );

CREATE POLICY "market_agent_portfolio_owner_write" ON public.market_agent_portfolio
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- market_service_requests: parties only
CREATE POLICY "market_requests_client_access" ON public.market_service_requests
  FOR ALL USING (auth.uid() = client_user_id);

CREATE POLICY "market_requests_agent_access" ON public.market_service_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "market_requests_agent_update" ON public.market_service_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- market_reviews: published reviews public, own review writable
CREATE POLICY "market_reviews_public_read" ON public.market_reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "market_reviews_reviewer_read" ON public.market_reviews
  FOR SELECT USING (auth.uid() = reviewer_user_id);

CREATE POLICY "market_reviews_agent_read" ON public.market_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "market_reviews_reviewer_insert" ON public.market_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_user_id
    AND EXISTS (
      SELECT 1 FROM public.market_service_requests
      WHERE id = service_request_id
        AND client_user_id = auth.uid()
        AND status = 'completed'
    )
  );

CREATE POLICY "market_reviews_agent_reply" ON public.market_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- market_agent_credentials: owner + superadmin
CREATE POLICY "market_credentials_owner" ON public.market_agent_credentials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.market_agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "market_credentials_public_verified" ON public.market_agent_credentials
  FOR SELECT USING (verified = true);

-- market_saved_agents: user's own
CREATE POLICY "market_saved_agents_own" ON public.market_saved_agents
  FOR ALL USING (auth.uid() = user_id);

-- market_milestone_events: parties of the service request
CREATE POLICY "milestone_events_parties" ON public.market_milestone_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.market_service_requests sr
      WHERE sr.id = service_request_id
      AND (
        sr.client_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.market_agents WHERE id = sr.agent_id AND user_id = auth.uid())
      )
    )
  );

-- market_official_fee_receipts: parties + superadmin
CREATE POLICY "fee_receipts_parties" ON public.market_official_fee_receipts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.market_service_requests sr
      WHERE sr.id = service_request_id
      AND (
        sr.client_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.market_agents WHERE id = sr.agent_id AND user_id = auth.uid())
      )
    )
  );

-- market_price_regulations: public read for authenticated
CREATE POLICY "price_regs_public_read" ON public.market_price_regulations
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 5. INDEXES
-- =============================================

-- market_agents
CREATE INDEX IF NOT EXISTS idx_market_agents_user ON public.market_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_market_agents_org ON public.market_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_market_agents_slug ON public.market_agents(slug);
CREATE INDEX IF NOT EXISTS idx_market_agents_country ON public.market_agents(country_code);
CREATE INDEX IF NOT EXISTS idx_market_agents_active ON public.market_agents(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_market_agents_rating ON public.market_agents(rating_avg DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_market_agents_reputation ON public.market_agents(reputation_score DESC NULLS LAST);

-- Full-text search on market_agents
CREATE INDEX IF NOT EXISTS idx_market_agents_fts ON public.market_agents
  USING gin(to_tsvector('spanish', coalesce(display_name,'') || ' ' || coalesce(firm_name,'') || ' ' || coalesce(bio,'') || ' ' || coalesce(city,'')));

-- GIN on array columns
CREATE INDEX IF NOT EXISTS idx_market_agents_jurisdictions ON public.market_agents USING gin(jurisdictions);
CREATE INDEX IF NOT EXISTS idx_market_agents_specializations ON public.market_agents USING gin(specializations);

-- market_agent_services
CREATE INDEX IF NOT EXISTS idx_market_agent_services_agent ON public.market_agent_services(agent_id);
CREATE INDEX IF NOT EXISTS idx_market_agent_services_type ON public.market_agent_services(service_type, jurisdiction_code);

-- market_service_requests
CREATE INDEX IF NOT EXISTS idx_market_requests_client ON public.market_service_requests(client_user_id, status);
CREATE INDEX IF NOT EXISTS idx_market_requests_agent ON public.market_service_requests(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_market_requests_status ON public.market_service_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_requests_number ON public.market_service_requests(request_number);

-- market_reviews
CREATE INDEX IF NOT EXISTS idx_market_reviews_agent ON public.market_reviews(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_market_reviews_request ON public.market_reviews(service_request_id);

-- market_milestone_events
CREATE INDEX IF NOT EXISTS idx_milestone_events_request ON public.market_milestone_events(service_request_id, created_at ASC);

-- market_official_fee_receipts
CREATE INDEX IF NOT EXISTS idx_fee_receipts_request ON public.market_official_fee_receipts(service_request_id, verified);

-- market_agent_credentials
CREATE INDEX IF NOT EXISTS idx_market_credentials_agent ON public.market_agent_credentials(agent_id, verified);

-- =============================================
-- 6. TRIGGERS
-- =============================================

-- Auto-generate slug on market_agents insert/update
CREATE TRIGGER trg_market_agents_slug
  BEFORE INSERT OR UPDATE OF display_name, firm_name ON public.market_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_agent_slug();

-- Update agent metrics when reviews change (DEFERRABLE)
CREATE CONSTRAINT TRIGGER trg_update_agent_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.market_reviews
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_metrics();

-- =============================================
-- 7. SEED: market_price_regulations
-- =============================================

INSERT INTO public.market_price_regulations
  (jurisdiction_code, jurisdiction_name, price_display_allowed, price_regulation_type, legal_basis, price_display_note)
VALUES
  ('EM','EUIPO — Unión Europea',true,'free',
   'Directiva 2006/123/CE (Servicios), Art. 25: honorarios libres',
   'Precio orientativo. Las tasas oficiales EUIPO se facturan aparte.'),
  ('US','USPTO — Estados Unidos',true,'free',
   'ABA Model Rules Rule 1.5: honorarios razonables, precio libre',
   'Orientative pricing. Official USPTO fees billed separately.'),
  ('ES','OEPM — España',true,'free',
   'Ley 2/2007 Colegios Profesionales: aranceles no obligatorios desde 2009',
   'Precio orientativo sin compromiso. Sujeto a presupuesto personalizado.'),
  ('GB','UKIPO — Reino Unido',true,'mandatory_estimate',
   'SRA Transparency Rules 2018: obligatorio publicar precio estimado',
   'Price estimate provided as required by SRA rules. Subject to final quote.'),
  ('FR','INPI — Francia',true,'free',
   'Loi Macron 2015: honorarios libres en servicios profesionales',
   'Tarif indicatif hors taxes officielles de l''INPI.'),
  ('DE','DPMA — Alemania',true,'reference_only',
   'RVG aplica solo a procedimientos judiciales; PI extrajudicial: libre',
   'Richtpreise. Amtliche DPMA-Gebühren werden separat berechnet.'),
  ('JP','JPO — Japón',true,'free',
   'Tarifas de referencia de JPAA no obligatorias para PI',
   'Reference pricing. JPO official fees billed separately.'),
  ('CN','CNIPA — China',true,'reference_only',
   'Tarifas de referencia ACPAA, no obligatorias',
   'Reference pricing only. CNIPA official fees separate.')
ON CONFLICT (jurisdiction_code) DO NOTHING;
