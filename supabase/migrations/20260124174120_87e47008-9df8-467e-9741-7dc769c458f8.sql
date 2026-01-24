-- =====================================================
-- RFQ Work Flow Tables - Mensajes, Archivos y Pagos
-- =====================================================

-- 1) Añadir campos de trabajo a rfq_requests
ALTER TABLE public.rfq_requests 
ADD COLUMN IF NOT EXISTS work_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS work_started_at timestamptz,
ADD COLUMN IF NOT EXISTS work_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS work_summary text,
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.market_users(id),
ADD COLUMN IF NOT EXISTS agreed_price numeric,
ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMENT ON COLUMN public.rfq_requests.work_status IS 'pending, in_progress, pending_review, completed, disputed, cancelled';

-- 2) Crear tabla de mensajes de trabajo RFQ
CREATE TABLE IF NOT EXISTS public.rfq_work_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id),
  message text NOT NULL,
  attachment_url text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  is_system boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_rfq_work_messages_request ON public.rfq_work_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_rfq_work_messages_sender ON public.rfq_work_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_rfq_work_messages_created ON public.rfq_work_messages(created_at DESC);

-- RLS para mensajes
ALTER TABLE public.rfq_work_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their RFQ requests"
ON public.rfq_work_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rfq_requests r
    WHERE r.id = rfq_work_messages.request_id
    AND (r.requester_id = auth.uid() OR r.agent_id = auth.uid())
  )
);

CREATE POLICY "Users can insert messages for their RFQ requests"
ON public.rfq_work_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.rfq_requests r
    WHERE r.id = rfq_work_messages.request_id
    AND (r.requester_id = auth.uid() OR r.agent_id = auth.uid())
  )
);

-- 3) Crear tabla de archivos de trabajo RFQ
CREATE TABLE IF NOT EXISTS public.rfq_work_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.users(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  is_deliverable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Índices para archivos
CREATE INDEX IF NOT EXISTS idx_rfq_work_files_request ON public.rfq_work_files(request_id);
CREATE INDEX IF NOT EXISTS idx_rfq_work_files_uploaded_by ON public.rfq_work_files(uploaded_by);

-- RLS para archivos
ALTER TABLE public.rfq_work_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files for their RFQ requests"
ON public.rfq_work_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rfq_requests r
    WHERE r.id = rfq_work_files.request_id
    AND (r.requester_id = auth.uid() OR r.agent_id = auth.uid())
  )
);

CREATE POLICY "Users can upload files for their RFQ requests"
ON public.rfq_work_files FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.rfq_requests r
    WHERE r.id = rfq_work_files.request_id
    AND (r.requester_id = auth.uid() OR r.agent_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own files"
ON public.rfq_work_files FOR DELETE
USING (uploaded_by = auth.uid());

-- 4) Crear tabla de pagos RFQ
CREATE TABLE IF NOT EXISTS public.rfq_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.market_users(id),
  client_id uuid NOT NULL REFERENCES public.users(id),
  quote_id uuid REFERENCES public.rfq_quotes(id),
  
  -- Montos
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  platform_fee numeric DEFAULT 0,
  agent_payout numeric,
  
  -- Stripe
  stripe_payment_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  
  -- Estado
  status text DEFAULT 'pending',
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.rfq_payments.status IS 'pending, processing, completed, refunded, failed';
COMMENT ON COLUMN public.rfq_payments.platform_fee IS 'Comisión de IP-NEXUS (ej: 10% del monto)';
COMMENT ON COLUMN public.rfq_payments.agent_payout IS 'Monto que recibe el agente (amount - platform_fee)';

-- Índices para pagos
CREATE INDEX IF NOT EXISTS idx_rfq_payments_request ON public.rfq_payments(request_id);
CREATE INDEX IF NOT EXISTS idx_rfq_payments_agent ON public.rfq_payments(agent_id);
CREATE INDEX IF NOT EXISTS idx_rfq_payments_client ON public.rfq_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_rfq_payments_status ON public.rfq_payments(status);
CREATE INDEX IF NOT EXISTS idx_rfq_payments_stripe ON public.rfq_payments(stripe_payment_id);

-- RLS para pagos
ALTER TABLE public.rfq_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.rfq_payments FOR SELECT
USING (client_id = auth.uid() OR agent_id = auth.uid());

CREATE POLICY "System can insert payments"
ON public.rfq_payments FOR INSERT
WITH CHECK (client_id = auth.uid());

-- 5) Crear tabla de reviews RFQ (si no existe una específica)
CREATE TABLE IF NOT EXISTS public.rfq_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.rfq_requests(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.market_users(id),
  reviewer_id uuid NOT NULL REFERENCES public.users(id),
  
  -- Ratings
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating integer CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  
  -- Content
  title text,
  comment text,
  
  -- Visibility
  is_public boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  
  -- Un review por request por reviewer
  UNIQUE(request_id, reviewer_id)
);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_rfq_reviews_agent ON public.rfq_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_rfq_reviews_request ON public.rfq_reviews(request_id);

-- RLS para reviews
ALTER TABLE public.rfq_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reviews are viewable by everyone"
ON public.rfq_reviews FOR SELECT
USING (is_public = true OR reviewer_id = auth.uid());

CREATE POLICY "Users can create reviews for completed requests"
ON public.rfq_reviews FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.rfq_requests r
    WHERE r.id = rfq_reviews.request_id
    AND r.requester_id = auth.uid()
    AND r.work_status = 'completed'
  )
);

-- 6) Función para calcular rating promedio del agente
CREATE OR REPLACE FUNCTION public.update_agent_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.market_users
  SET 
    reputation_score = (
      SELECT COALESCE(AVG(overall_rating) * 20, 0)::integer
      FROM public.rfq_reviews
      WHERE agent_id = NEW.agent_id AND is_public = true
    ),
    updated_at = now()
  WHERE id = NEW.agent_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para actualizar rating
DROP TRIGGER IF EXISTS trg_update_agent_rating ON public.rfq_reviews;
CREATE TRIGGER trg_update_agent_rating
AFTER INSERT OR UPDATE ON public.rfq_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_agent_rating();

-- 7) Función para asignar agente cuando se acepta oferta
CREATE OR REPLACE FUNCTION public.assign_rfq_agent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'awarded' AND OLD.status != 'awarded' THEN
    UPDATE public.rfq_requests
    SET 
      agent_id = NEW.agent_id,
      agreed_price = NEW.total_price,
      work_status = 'in_progress',
      work_started_at = now(),
      updated_at = now()
    WHERE id = NEW.request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para asignar agente
DROP TRIGGER IF EXISTS trg_assign_rfq_agent ON public.rfq_quotes;
CREATE TRIGGER trg_assign_rfq_agent
AFTER UPDATE ON public.rfq_quotes
FOR EACH ROW
EXECUTE FUNCTION public.assign_rfq_agent();