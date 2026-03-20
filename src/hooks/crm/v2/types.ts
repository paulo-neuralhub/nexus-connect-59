// ============================================================
// IP-NEXUS CRM V2 - Shared types for hooks
// Aligned to actual crm_* database schema
// ============================================================

export type UUID = string;

// ── crm_accounts ──
export interface CRMAccount {
  id: UUID;
  organization_id: UUID;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  client_token: string | null;
  account_type: string | null;
  vat_number: string | null;
  country_code: string | null;
  city: string | null;
  address: string | null;
  industry: string | null;
  ip_portfolio_size: number;
  annual_ip_budget_eur: number | null;
  preferred_language: string | null;
  status: string | null;
  tier: string | null;
  health_score: number | null;
  rating_stars: number | null;
  lifecycle_stage: string | null;
  assigned_to: UUID | null;
  tags: string[];
  notes: string | null;
  is_active: boolean;
  last_interaction_at: string | null;
  client_type_id: UUID | null;
  payment_classification_id: UUID | null;
  created_at: string;
  updated_at: string;
  // Joined (optional, only when selected in query)
  assigned_user?: { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
  client_type?: { id: string; name: string; color: string } | null;
  matters_count?: number;
  // Allow extra fields accessed via `as any` in legacy consumers
  [key: string]: unknown;
}

export interface AccountFilters {
  search?: string;
  lifecycle_stage?: string | null;
  account_type?: string | null;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  order_by?: "name" | "created_at" | "ip_portfolio_size";
  order_asc?: boolean;
}

// ── crm_contacts ──
export interface CRMContact {
  id: UUID;
  organization_id: UUID;
  account_id: UUID | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  job_title: string | null;
  role: string | null;
  is_primary: boolean;
  is_lead: boolean;
  lead_score: number | null;
  lead_status: string | null;
  portal_access_enabled: boolean;
  preferred_language: string | null;
  country_code: string | null;
  city: string | null;
  tags: string[];
  notes: string | null;
  assigned_to: UUID | null;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  account?: { id: string; name: string } | null;
}

export interface ContactFilters {
  account_id?: UUID;
  role?: string;
  country_code?: string;
  search?: string;
}

// ── crm_deals ──
export interface CRMDeal {
  id: UUID;
  organization_id: UUID;
  account_id: UUID | null;
  contact_id: UUID | null;
  owner_id: UUID | null;
  assigned_to: UUID | null;
  name: string;
  stage: string | null;
  pipeline_id: UUID | null;
  pipeline_stage_id: UUID | null;
  deal_type: string | null;
  opportunity_type: string | null;
  jurisdiction_code: string | null;
  nice_classes: number[] | null;
  amount: number | null;
  amount_eur: number | null;
  weighted_amount: number | null;
  official_fees_eur: number | null;
  professional_fees_eur: number | null;
  probability_pct: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  stage_entered_at: string | null;
  stage_history: unknown[];
  close_reason: string | null;
  lost_reason: string | null;
  lost_to_competitor: string | null;
  matter_id: UUID | null;
  account_name_cache: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  account?: { id: string; name: string } | null;
  contact?: { id: string; full_name: string } | null;
  owner?: { id: string; full_name?: string | null } | null;
  pipeline_stage?: { id: string; name: string; color: string; probability: number; is_won_stage: boolean; is_lost_stage: boolean } | null;
}

export interface DealFilters {
  pipeline_id?: UUID;
  pipeline_stage_id?: UUID;
  assigned_to?: UUID;
  account_id?: UUID;
  deal_type?: string;
  search?: string;
}

// ── crm_activities ──
export interface CRMActivity {
  id: UUID;
  organization_id: UUID;
  account_id: UUID | null;
  contact_id: UUID | null;
  deal_id: UUID | null;
  activity_type: string;
  subject: string | null;
  description: string | null;
  activity_date: string;
  duration_minutes: number | null;
  outcome: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_by: UUID | null;
  created_at: string;
  updated_at: string;
  // Joined
  account?: { id: string; name: string } | null;
  contact?: { id: string; full_name: string } | null;
  deal?: { id: string; name: string } | null;
  creator?: { id: string; first_name: string | null; last_name: string | null } | null;
}

export interface ActivityFilters {
  account_id?: UUID;
  contact_id?: UUID;
  deal_id?: UUID;
  activity_type?: string;
  date_from?: string;
  date_to?: string;
}

// ── crm_pipelines / crm_pipeline_stages ──
export interface CRMPipelineStage {
  id: UUID;
  pipeline_id: UUID;
  name: string;
  color: string;
  probability: number;
  position: number;
  is_won_stage: boolean;
  is_lost_stage: boolean;
  created_at: string;
}

export interface CRMPipeline {
  id: UUID;
  organization_id: UUID;
  name: string;
  description: string | null;
  pipeline_type: string | null;
  is_default: boolean;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  stages?: CRMPipelineStage[];
}

// ── crm_leads ──
export interface CRMLead {
  id: UUID;
  organization_id: UUID;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  source: string | null;
  lead_score: number | null;
  lead_status: string | null;
  assigned_to: UUID | null;
  notes: string | null;
  tags: string[];
  converted_account_id: UUID | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── crm_tasks ──
export interface CRMTask {
  id: UUID;
  organization_id: UUID;
  account_id: UUID | null;
  contact_id: UUID | null;
  deal_id: UUID | null;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_to: UUID | null;
  created_by: UUID | null;
  created_at: string;
  updated_at: string;
  // Joined
  account?: { id: string; name: string } | null;
  contact?: { id: string; full_name: string } | null;
  deal?: { id: string; name: string } | null;
}

// ── Dashboard KPIs ──
export interface CRMDashboardKPIs {
  active_accounts: number;
  total_pipeline_eur: number;
  deals_this_month: number;
  activities_today: number;
}
