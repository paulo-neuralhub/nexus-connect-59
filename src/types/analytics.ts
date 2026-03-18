// =====================================================
// PRODUCT ANALYTICS TYPES
// Para métricas de USO de la plataforma (no PI)
// =====================================================

export interface AnalyticsEvent {
  id: string;
  organization_id?: string;
  user_id?: string;
  session_id: string;
  event_name: string;
  event_category: EventCategory;
  page_path?: string;
  page_title?: string;
  referrer?: string;
  properties?: Record<string, unknown>;
  device_type?: DeviceType;
  browser?: string;
  os?: string;
  screen_resolution?: string;
  country_code?: string;
  region?: string;
  event_date?: string;
  created_at: string;
}

export type EventCategory =
  | 'page_view'
  | 'feature_use'
  | 'search'
  | 'ai_interaction'
  | 'market_action'
  | 'document_action'
  | 'error'
  | 'conversion'
  | 'engagement';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface DailyMetrics {
  id: string;
  metric_date: string;
  organization_id?: string;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  new_users: number;
  returning_users: number;
  total_sessions: number;
  avg_session_duration_seconds: number;
  bounce_rate: number;
  pages_per_session: number;
  ai_queries: number;
  searches_performed: number;
  documents_generated: number;
  matters_created: number;
  quote_requests_created: number;
  quotes_sent: number;
  client_errors: number;
  server_errors: number;
  avg_page_load_ms: number;
  p95_page_load_ms: number;
  top_pages: TopPage[];
  top_features: TopFeature[];
  created_at?: string;
  updated_at?: string;
}

export interface TopPage {
  path: string;
  views: number;
  avg_time?: number;
}

export interface TopFeature {
  feature: string;
  uses: number;
}

export interface FeatureUsage {
  id: string;
  organization_id?: string;
  user_id?: string;
  feature_key: FeatureKey;
  context?: Record<string, unknown>;
  duration_seconds?: number;
  success?: boolean;
  created_at: string;
}

export type FeatureKey =
  // Core
  | 'dashboard'
  | 'matters_list'
  | 'matter_detail'
  | 'search_basic'
  | 'search_advanced'
  | 'search_ai'
  // Documents
  | 'document_viewer'
  | 'document_generator'
  | 'document_upload'
  // AI
  | 'ai_genius_chat'
  | 'ai_genius_analyze'
  | 'ai_genius_draft'
  | 'ai_spider_search'
  | 'ai_spider_monitor'
  // Marketplace
  | 'market_browse'
  | 'market_request_quote'
  | 'market_send_quote'
  // Admin
  | 'settings'
  | 'team_management'
  | 'billing'
  // Others
  | 'calendar'
  | 'reports'
  | 'export';

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label: string;
}

export type AnalyticsPeriodType = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsFilter {
  period: AnalyticsPeriodType;
  startDate?: Date;
  endDate?: Date;
}

export interface AnalyticsSummary {
  avgDAU: number;
  latestWAU: number;
  latestMAU: number;
  totalSessions: number;
  totalAIQueries: number;
  avgBounceRate: string;
  trend: DailyMetrics[];
}

export interface TrendDataPoint {
  metric_date: string;
  [key: string]: string | number;
}
