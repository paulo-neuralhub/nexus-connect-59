/**
 * WhatsApp Integration Types for IP-NEXUS
 * Supports both Meta API and QR Web integrations
 */

// ============================================
// Core Type Aliases
// ============================================
export type WhatsAppIntegrationType = 'none' | 'meta_api' | 'qr_web';
export type ImplementationStatus = 'none' | 'pending' | 'in_progress' | 'completed' | 'rejected';
export type QRSessionStatus = 'disconnected' | 'qr_pending' | 'connected' | 'error';
export type MessageDirection = 'incoming' | 'outgoing';
export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';
export type MessageStatus = 'received' | 'sent' | 'delivered' | 'read' | 'failed';

// Legacy aliases for backward compatibility
export type WhatsAppMetaStatus = 'not_configured' | 'pending' | 'active' | 'error';
export type WhatsAppImplementationStatus = ImplementationStatus;
export type WhatsAppQRSessionStatus = QRSessionStatus;
export type WhatsAppMessageDirection = MessageDirection;
export type WhatsAppMessageType = MessageType;
export type WhatsAppMessageStatus = MessageStatus;
export type WhatsAppConversationStatus = 'open' | 'closed' | 'archived';

// ============================================
// Tenant Configuration
// ============================================
export interface WhatsAppTenantConfig {
  id: string;
  organizationId: string;
  integrationType: WhatsAppIntegrationType;
  
  // Meta API
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;
  metaAccessToken?: string;
  metaWebhookVerifyToken?: string;
  metaAppId?: string;
  metaStatus: string;
  
  // Implementation request
  implementationRequested: boolean;
  implementationRequestDate?: string;
  implementationStatus: ImplementationStatus;
  implementationNotes?: string;
  
  // Configuration
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  notifyNewMessages: boolean;
  notifyEmail?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// QR Session
// ============================================
export interface WhatsAppQRSession {
  id: string;
  organizationId: string;
  userId: string;
  status: QRSessionStatus;
  phoneNumber?: string;
  deviceName?: string;
  sessionData?: Record<string, unknown>;
  lastSeen?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  isActive: boolean;
  receiveNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Message
// ============================================
export interface WhatsAppMessage {
  id: string;
  organizationId: string;
  waId: string;
  contactName?: string;
  contactPhone: string;
  clientId?: string;
  messageId: string;
  direction: MessageDirection;
  messageType: MessageType;
  content?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaFilename?: string;
  mediaCaption?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationName?: string;
  status: MessageStatus;
  errorMessage?: string;
  timestamp: string;
  readAt?: string;
  readBy?: string;
  sentBy?: string;
  source: 'meta_api' | 'qr_web';
  sessionId?: string;
  createdAt?: string;
}

// ============================================
// Conversation
// ============================================
export interface WhatsAppConversation {
  id: string;
  organizationId: string;
  contactPhone: string;
  contactName?: string;
  waId?: string;
  clientId?: string;
  client?: {
    id: string;
    name: string;
    full_name?: string;
    company_name?: string;
    avatar_url?: string;
  };
  status: 'open' | 'closed' | 'archived';
  assignedTo?: string;
  assigned_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  lastMessageId?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  totalMessages: number;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Implementation Request
// ============================================
export interface ImplementationRequest {
  id: string;
  organizationId: string;
  requestedBy: string;
  requestedAt: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  planType: 'standard' | 'premium' | 'enterprise';
  estimatedMonthlyMessages?: number;
  currentWhatsappNumber?: string;
  additionalNotes?: string;
  status: ImplementationStatus;
  assignedAdmin?: string;
  adminNotes?: string;
  contactedAt?: string;
  completedAt?: string;
  quotedPrice?: number;
  setupFee?: number;
  monthlyFee?: number;
  invoiceId?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Joined data
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  requester?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Legacy alias
export type WhatsAppImplementationRequest = ImplementationRequest;

// ============================================
// Form Types
// ============================================
export interface WhatsAppSettingsForm {
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  notifyNewMessages: boolean;
  notifyEmail: string;
}

export interface WhatsAppImplementationRequestForm {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  planType: 'standard' | 'premium' | 'enterprise';
  estimatedMonthlyMessages: number | null;
  currentWhatsappNumber: string;
  additionalNotes: string;
}

// ============================================
// API Params
// ============================================
export interface SendWhatsAppMessageParams {
  recipientPhone: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: MessageType;
  contactId?: string;
}

// ============================================
// DB Row Types (snake_case for Supabase)
// ============================================
export interface WhatsAppTenantConfigRow {
  id: string;
  organization_id: string;
  integration_type: WhatsAppIntegrationType;
  meta_phone_number_id: string | null;
  meta_business_account_id: string | null;
  meta_access_token: string | null;
  meta_webhook_verify_token: string | null;
  meta_app_id: string | null;
  meta_status: string;
  implementation_requested: boolean;
  implementation_request_date: string | null;
  implementation_status: ImplementationStatus;
  implementation_notes: string | null;
  auto_reply_enabled: boolean;
  auto_reply_message: string;
  business_hours_only: boolean;
  business_hours_start: string;
  business_hours_end: string;
  notify_new_messages: boolean;
  notify_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessageRow {
  id: string;
  organization_id: string;
  wa_id: string;
  contact_name: string | null;
  contact_phone: string;
  client_id: string | null;
  message_id: string | null;
  direction: MessageDirection;
  message_type: MessageType;
  content: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  media_filename: string | null;
  media_caption: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  location_name: string | null;
  status: MessageStatus;
  error_message: string | null;
  timestamp: string;
  read_at: string | null;
  read_by: string | null;
  sent_by: string | null;
  source: 'meta_api' | 'qr_web';
  session_id: string | null;
  created_at: string;
}

export interface WhatsAppConversationRow {
  id: string;
  organization_id: string;
  contact_phone: string;
  contact_name: string | null;
  wa_id: string | null;
  client_id: string | null;
  status: 'open' | 'closed' | 'archived';
  assigned_to: string | null;
  last_message_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  total_messages: number;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
