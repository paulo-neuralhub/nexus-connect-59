// ============================================================
// IP-NEXUS — Communications Module Types (COMM-01)
// ============================================================

export type CommChannel = 'email' | 'whatsapp' | 'sms' | 'internal' | 'portal' | 'call';
export type CommThreadStatus = 'open' | 'pending' | 'closed' | 'archived';
export type CommMessageStatus = 'draft' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';

export interface CommThread {
  id: string;
  organization_id: string;
  matter_id: string | null;
  crm_account_id: string | null;
  crm_contact_id: string | null;
  additional_matter_ids: string[];
  channel: CommChannel;
  email_thread_id: string | null;
  whatsapp_conversation_id: string | null;
  participants: CommParticipant[];
  subject: string | null;
  status: CommThreadStatus;
  assigned_to: string | null;
  message_count: number;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: string | null;
  auto_indexed: boolean;
  indexing_confidence: 'none' | 'low' | 'high' | 'manual';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  matter?: { id: string; reference_number?: string; title?: string } | null;
  crm_account?: { id: string; name?: string } | null;
  assigned_profile?: { id: string; first_name?: string; last_name?: string } | null;
}

export interface CommParticipant {
  type: 'user' | 'contact' | 'external_email';
  id?: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CommMessage {
  id: string;
  organization_id: string;
  thread_id: string;
  sender_type: 'user' | 'contact' | 'system' | 'bot';
  sender_id: string | null;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  channel: CommChannel;
  content_type: string;
  body: string | null;
  body_html: string | null;
  template_name: string | null;
  template_language: string | null;
  template_params: Record<string, unknown> | null;
  attachments: CommAttachment[];
  content_hash: string | null;
  is_legally_critical: boolean;
  status: CommMessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_reason: string | null;
  provider_message_id: string | null;
  provider: string | null;
  email_message_id: string | null;
  email_in_reply_to: string | null;
  is_draft: boolean;
  telephony_cdr_id: string | null;
  idempotency_key: string | null;
  created_at: string;
}

export interface CommAttachment {
  filename: string;
  size_bytes: number;
  mime_type: string;
  storage_path: string;
  virus_scanned?: boolean;
  scan_result?: string;
}

export interface CommTenantConfig {
  id: string;
  organization_id: string;
  is_active: boolean;
  plan_code: string;
  max_email_per_month: number;
  max_whatsapp_per_month: number;
  max_sms_per_month: number;
  current_month_emails: number;
  current_month_whatsapp: number;
  current_month_sms: number;
  email_provider: string;
  sending_domain: string | null;
  domain_verified: boolean;
  email_from_name: string | null;
  email_from_address: string | null;
  email_signature_html: string | null;
  whatsapp_enabled: boolean;
  whatsapp_bsp: string;
  whatsapp_phone_number_id: string | null;
  whatsapp_display_name: string | null;
  sms_enabled: boolean;
  internal_chat_enabled: boolean;
  retention_days: number;
}

export interface ChannelStats {
  channel: CommChannel;
  total: number;
  unread: number;
}

export interface CommTemplate {
  id: string;
  organization_id: string;
  name: string;
  channel: CommChannel;
  category: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  whatsapp_template_name: string | null;
  whatsapp_approval_status: string;
  available_variables: { key: string; description: string }[];
  is_active: boolean;
  is_system_default: boolean;
}
