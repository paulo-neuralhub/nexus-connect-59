/**
 * WhatsApp utility functions for data transformation
 */

import type {
  WhatsAppTenantConfig,
  WhatsAppTenantConfigRow,
  WhatsAppMessage,
  WhatsAppMessageRow,
  WhatsAppConversation,
  WhatsAppConversationRow,
} from '@/types/whatsapp';

// Transform DB row to camelCase interface
export function transformConfig(row: WhatsAppTenantConfigRow): WhatsAppTenantConfig {
  return {
    id: row.id,
    organizationId: row.organization_id,
    integrationType: row.integration_type,
    metaPhoneNumberId: row.meta_phone_number_id ?? undefined,
    metaBusinessAccountId: row.meta_business_account_id ?? undefined,
    metaAccessToken: row.meta_access_token ?? undefined,
    metaWebhookVerifyToken: row.meta_webhook_verify_token ?? undefined,
    metaAppId: row.meta_app_id ?? undefined,
    metaStatus: row.meta_status,
    implementationRequested: row.implementation_requested,
    implementationRequestDate: row.implementation_request_date ?? undefined,
    implementationStatus: row.implementation_status,
    implementationNotes: row.implementation_notes ?? undefined,
    autoReplyEnabled: row.auto_reply_enabled,
    autoReplyMessage: row.auto_reply_message,
    businessHoursOnly: row.business_hours_only,
    businessHoursStart: row.business_hours_start,
    businessHoursEnd: row.business_hours_end,
    notifyNewMessages: row.notify_new_messages,
    notifyEmail: row.notify_email ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformMessage(row: WhatsAppMessageRow): WhatsAppMessage {
  return {
    id: row.id,
    organizationId: row.organization_id,
    waId: row.wa_id,
    contactName: row.contact_name ?? undefined,
    contactPhone: row.contact_phone,
    clientId: row.client_id ?? undefined,
    messageId: row.message_id ?? '',
    direction: row.direction,
    messageType: row.message_type,
    content: row.content ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    mediaMimeType: row.media_mime_type ?? undefined,
    mediaFilename: row.media_filename ?? undefined,
    mediaCaption: row.media_caption ?? undefined,
    locationLatitude: row.location_latitude ?? undefined,
    locationLongitude: row.location_longitude ?? undefined,
    locationName: row.location_name ?? undefined,
    status: row.status,
    errorMessage: row.error_message ?? undefined,
    timestamp: row.timestamp,
    readAt: row.read_at ?? undefined,
    readBy: row.read_by ?? undefined,
    sentBy: row.sent_by ?? undefined,
    source: row.source,
    sessionId: row.session_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function transformConversation(row: WhatsAppConversationRow & { 
  client?: { id: string; name: string; company_name?: string } | null;
  assigned_user?: { id: string; full_name: string; avatar_url?: string } | null;
}): WhatsAppConversation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    contactPhone: row.contact_phone,
    contactName: row.contact_name ?? undefined,
    waId: row.wa_id ?? undefined,
    clientId: row.client_id ?? undefined,
    client: row.client ? {
      id: row.client.id,
      name: row.client.name,
      full_name: row.client.name,
      company_name: row.client.company_name,
    } : undefined,
    status: row.status,
    assignedTo: row.assigned_to ?? undefined,
    assigned_user: row.assigned_user ?? undefined,
    lastMessageId: row.last_message_id ?? undefined,
    lastMessageAt: row.last_message_at ?? undefined,
    lastMessagePreview: row.last_message_preview ?? undefined,
    unreadCount: row.unread_count,
    totalMessages: row.total_messages,
    tags: row.tags ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
