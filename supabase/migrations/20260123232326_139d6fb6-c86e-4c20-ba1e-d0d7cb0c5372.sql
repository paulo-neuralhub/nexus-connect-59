-- P-SYSTEM-02 (parte DB): Stripe para VoIP sin romper Stripe SaaS existente

-- 0) helper: updated_at trigger (si no existe)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Extender stripe_products existente para mapear VoIP plans
alter table public.stripe_products
  add column if not exists voip_plan_id uuid;

-- partial unique: un producto Stripe por plan VoIP
create unique index if not exists stripe_products_voip_plan_unique
  on public.stripe_products (voip_plan_id)
  where voip_plan_id is not null;

create index if not exists stripe_products_voip_plan_idx
  on public.stripe_products (voip_plan_id);

-- 2) Tablas nuevas (VoIP) según P-SYSTEM-02
create table if not exists public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_customer_record_id uuid not null references public.stripe_customers(id) on delete cascade,

  stripe_subscription_id text unique not null,
  stripe_price_id text not null,

  voip_subscription_id uuid references public.voip_subscriptions(id) on delete set null,

  status text not null,

  current_period_start timestamptz,
  current_period_end timestamptz,

  trial_start timestamptz,
  trial_end timestamptz,

  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  cancellation_reason text,

  amount_cents integer not null,
  currency text default 'eur',

  stripe_metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists stripe_subscriptions_org_idx on public.stripe_subscriptions(organization_id);
create index if not exists stripe_subscriptions_status_idx on public.stripe_subscriptions(status);

create trigger set_stripe_subscriptions_updated_at
before update on public.stripe_subscriptions
for each row execute function public.set_updated_at();

create table if not exists public.stripe_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_subscription_record_id uuid references public.stripe_subscriptions(id) on delete set null,

  stripe_invoice_id text unique not null,
  stripe_charge_id text,
  stripe_payment_intent_id text,

  invoice_number text,

  subtotal_cents integer not null,
  tax_cents integer default 0,
  total_cents integer not null,
  amount_paid_cents integer default 0,
  amount_due_cents integer default 0,

  currency text default 'eur',

  status text not null,
  billing_reason text,

  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz,
  paid_at timestamptz,

  invoice_pdf_url text,
  hosted_invoice_url text,

  attempt_count integer default 0,
  next_payment_attempt timestamptz,
  last_error_message text,

  created_at timestamptz default now()
);

create index if not exists stripe_invoices_org_idx on public.stripe_invoices(organization_id);
create index if not exists stripe_invoices_status_idx on public.stripe_invoices(status);
create index if not exists stripe_invoices_period_idx on public.stripe_invoices(period_start, period_end);

create table if not exists public.stripe_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  stripe_invoice_record_id uuid references public.stripe_invoices(id) on delete set null,

  stripe_payment_intent_id text,
  stripe_charge_id text,

  amount_cents integer not null,
  currency text default 'eur',

  status text not null,

  error_code text,
  error_message text,
  error_decline_code text,

  payment_method_type text,
  card_brand text,
  card_last4 text,

  created_at timestamptz default now()
);

create index if not exists stripe_payment_attempts_org_idx on public.stripe_payment_attempts(organization_id);
create index if not exists stripe_payment_attempts_invoice_idx on public.stripe_payment_attempts(stripe_invoice_record_id);
create index if not exists stripe_payment_attempts_status_idx on public.stripe_payment_attempts(status);

-- 3) RLS: lectura por tenant (solo SELECT), escritura solo service role (edge functions)
alter table public.stripe_subscriptions enable row level security;
alter table public.stripe_invoices enable row level security;
alter table public.stripe_payment_attempts enable row level security;

-- SELECT own org
create policy "stripe_subscriptions_select_own_org"
  on public.stripe_subscriptions
  for select
  to authenticated
  using (
    organization_id in (
      select m.organization_id from public.memberships m where m.user_id = auth.uid()
    )
  );

create policy "stripe_invoices_select_own_org"
  on public.stripe_invoices
  for select
  to authenticated
  using (
    organization_id in (
      select m.organization_id from public.memberships m where m.user_id = auth.uid()
    )
  );

create policy "stripe_payment_attempts_select_own_org"
  on public.stripe_payment_attempts
  for select
  to authenticated
  using (
    organization_id in (
      select m.organization_id from public.memberships m where m.user_id = auth.uid()
    )
  );
