// =====================================================
// TIPOS PARA USUARIOS DEL MARKETPLACE IP-MARKET
// =====================================================

export type MarketUserType = 
  | 'internal_agent'    // Agente con cuenta IP-NEXUS completa
  | 'external_agent'    // Agente externo (solo Market)
  | 'ip_holder'         // Titular de PI (vende/licencia)
  | 'service_seeker'    // Busca servicios de PI
  | 'investor'          // Busca invertir en PI
  | 'visitor';          // Solo navega (pre-registro)

export type AgentType =
  | 'patent_attorney'
  | 'trademark_attorney'
  | 'ip_lawyer'
  | 'patent_agent'
  | 'trademark_agent'
  | 'ip_consultant'
  | 'licensing_specialist'
  | 'valuation_expert';

export type CompanyType =
  | 'solo_practitioner'
  | 'small_firm'
  | 'medium_firm'
  | 'large_firm'
  | 'corporate'
  | 'startup'
  | 'other';

export type KycStatus = 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired';

export type MarketBadge =
  | 'top_performer'
  | 'fast_responder'
  | 'verified_pro'
  | 'trusted_agent'
  | 'rising_star'
  | 'expert_patents'
  | 'expert_trademarks'
  | 'multilingual'
  | 'global_reach';

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

export interface MarketUser {
  id: string;
  auth_user_id?: string | null;
  organization_id?: string | null;
  user_type: MarketUserType;
  
  // Datos básicos
  email: string;
  display_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  country: string;
  city?: string | null;
  timezone: string;
  languages: string[];
  bio?: string | null;
  
  // Datos profesionales
  is_agent: boolean;
  agent_type?: AgentType | null;
  license_number?: string | null;
  bar_association?: string | null;
  jurisdictions: string[];
  specializations: string[];
  years_experience?: number | null;
  hourly_rate?: number | null;
  rate_currency: string;
  
  // Empresa
  company_name?: string | null;
  company_type?: CompanyType | null;
  company_website?: string | null;
  company_logo_url?: string | null;
  
  // KYC
  kyc_level: number;
  kyc_status: KycStatus;
  kyc_verified_at?: string | null;
  kyc_expires_at?: string | null;
  kyc_documents?: any[];
  
  // Verificación de agente
  is_verified_agent: boolean;
  agent_verified_at?: string | null;
  agent_verification_notes?: string | null;
  
  // Métricas
  reputation_score: number;
  total_transactions: number;
  successful_transactions: number;
  total_volume: number;
  rating_avg: number;
  ratings_count: number;
  success_rate: number;
  response_time_avg: number;
  communication_score: number;
  rank_position?: number | null;
  rank_percentile?: number | null;
  
  // Badges
  badges: MarketBadge[];
  
  // Config
  is_active: boolean;
  is_public_profile: boolean;
  accepts_new_clients: boolean;
  notification_preferences?: {
    email_new_rfq?: boolean;
    email_messages?: boolean;
    email_reviews?: boolean;
    push_enabled?: boolean;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface MarketUserReview {
  id: string;
  reviewed_user_id: string;
  reviewer_id: string;
  transaction_id?: string | null;
  
  // Ratings
  rating_overall: number;
  rating_communication?: number | null;
  rating_quality?: number | null;
  rating_timeliness?: number | null;
  rating_value?: number | null;
  
  // Content
  title?: string | null;
  comment?: string | null;
  response?: string | null;
  response_at?: string | null;
  
  // Moderation
  is_verified: boolean;
  is_visible: boolean;
  is_flagged: boolean;
  flag_reason?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Joins
  reviewer?: Pick<MarketUser, 'id' | 'display_name' | 'avatar_url' | 'country'>;
}

// =====================================================
// LABELS Y CONFIGURACIÓN
// =====================================================

export const USER_TYPE_LABELS: Record<MarketUserType, { en: string; es: string }> = {
  internal_agent: { en: 'IP-NEXUS Agent', es: 'Agente IP-NEXUS' },
  external_agent: { en: 'External Agent', es: 'Agente Externo' },
  ip_holder: { en: 'IP Holder', es: 'Titular de PI' },
  service_seeker: { en: 'Service Seeker', es: 'Buscador de Servicios' },
  investor: { en: 'Investor', es: 'Inversor' },
  visitor: { en: 'Visitor', es: 'Visitante' },
};

export const AGENT_TYPE_LABELS: Record<AgentType, { en: string; es: string; icon: string }> = {
  patent_attorney: { en: 'Patent Attorney', es: 'Abogado de Patentes', icon: 'FileText' },
  trademark_attorney: { en: 'Trademark Attorney', es: 'Abogado de Marcas', icon: 'Tag' },
  ip_lawyer: { en: 'IP Lawyer', es: 'Abogado de PI', icon: 'Scale' },
  patent_agent: { en: 'Patent Agent', es: 'Agente de Patentes', icon: 'FileCheck' },
  trademark_agent: { en: 'Trademark Agent', es: 'Agente de Marcas', icon: 'Stamp' },
  ip_consultant: { en: 'IP Consultant', es: 'Consultor de PI', icon: 'Lightbulb' },
  licensing_specialist: { en: 'Licensing Specialist', es: 'Especialista en Licencias', icon: 'Key' },
  valuation_expert: { en: 'Valuation Expert', es: 'Experto en Valoración', icon: 'Calculator' },
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, { en: string; es: string }> = {
  solo_practitioner: { en: 'Solo Practitioner', es: 'Profesional Independiente' },
  small_firm: { en: 'Small Firm', es: 'Despacho Pequeño' },
  medium_firm: { en: 'Medium Firm', es: 'Despacho Mediano' },
  large_firm: { en: 'Large Firm', es: 'Gran Despacho' },
  corporate: { en: 'Corporate', es: 'Corporación' },
  startup: { en: 'Startup', es: 'Startup' },
  other: { en: 'Other', es: 'Otro' },
};

export const BADGE_CONFIG: Record<MarketBadge, {
  label: string;
  labelEs: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  top_performer: { 
    label: 'Top Performer', 
    labelEs: 'Top Performer', 
    icon: 'Trophy', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  fast_responder: { 
    label: 'Fast Responder', 
    labelEs: 'Respuesta Rápida', 
    icon: 'Zap', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  verified_pro: { 
    label: 'Verified Pro', 
    labelEs: 'Profesional Verificado', 
    icon: 'BadgeCheck', 
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  trusted_agent: { 
    label: 'Trusted Agent', 
    labelEs: 'Agente de Confianza', 
    icon: 'Shield', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  rising_star: { 
    label: 'Rising Star', 
    labelEs: 'Estrella en Ascenso', 
    icon: 'Star', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  expert_patents: { 
    label: 'Patent Expert', 
    labelEs: 'Experto en Patentes', 
    icon: 'FileText', 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  expert_trademarks: { 
    label: 'Trademark Expert', 
    labelEs: 'Experto en Marcas', 
    icon: 'Tag', 
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  multilingual: { 
    label: 'Multilingual', 
    labelEs: 'Multilingüe', 
    icon: 'Languages', 
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  global_reach: { 
    label: 'Global Reach', 
    labelEs: 'Alcance Global', 
    icon: 'Globe', 
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  },
};

// =====================================================
// FILTROS Y HELPERS
// =====================================================

export interface MarketUserFilters {
  search?: string;
  user_types?: MarketUserType[];
  agent_types?: AgentType[];
  countries?: string[];
  jurisdictions?: string[];
  specializations?: string[];
  min_rating?: number;
  min_reputation?: number;
  is_verified_only?: boolean;
  accepts_new_clients?: boolean;
}

export function getReputationColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function getReputationLabel(score: number): { en: string; es: string } {
  if (score >= 90) return { en: 'Excellent', es: 'Excelente' };
  if (score >= 80) return { en: 'Very Good', es: 'Muy Bueno' };
  if (score >= 70) return { en: 'Good', es: 'Bueno' };
  if (score >= 60) return { en: 'Acceptable', es: 'Aceptable' };
  if (score >= 50) return { en: 'Average', es: 'Promedio' };
  return { en: 'Low', es: 'Bajo' };
}

export function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}
