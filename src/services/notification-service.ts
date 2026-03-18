// src/services/notification-service.ts
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// ============================================
// TYPES
// ============================================

export type NotificationCategory = 
  | 'deadlines'
  | 'filings'
  | 'tasks'
  | 'portfolio'
  | 'approvals'
  | 'signatures'
  | 'comments'
  | 'team'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPayload {
  organizationId: string;
  userId: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
  priority?: NotificationPriority;
  groupKey?: string;
}

export interface NotificationPreferencesData {
  deadlines: { in_app: boolean; email: boolean; push: boolean; advance_days?: number[] };
  filings: { in_app: boolean; email: boolean; push: boolean };
  tasks: { in_app: boolean; email: boolean; push: boolean };
  portfolio: { in_app: boolean; email: boolean; push: boolean };
  approvals: { in_app: boolean; email: boolean; push: boolean };
  signatures: { in_app: boolean; email: boolean; push: boolean };
  comments: { in_app: boolean; email: boolean | 'mentions_only'; push: boolean };
  team: { in_app: boolean; email: boolean; push: boolean };
  system: { in_app: boolean; email: boolean; push: boolean };
}

// ============================================
// DEFAULT PREFERENCES
// ============================================

export const DEFAULT_PREFERENCES: NotificationPreferencesData = {
  deadlines: { in_app: true, email: true, push: true, advance_days: [7, 3, 1] },
  filings: { in_app: true, email: true, push: false },
  tasks: { in_app: true, email: false, push: false },
  portfolio: { in_app: true, email: false, push: false },
  approvals: { in_app: true, email: true, push: true },
  signatures: { in_app: true, email: true, push: true },
  comments: { in_app: true, email: 'mentions_only', push: false },
  team: { in_app: true, email: false, push: false },
  system: { in_app: true, email: true, push: false },
};

// ============================================
// NOTIFICATION SERVICE
// ============================================

class NotificationServiceClass {
  // ==========================================
  // SEND NOTIFICATION
  // ==========================================

  async send(payload: NotificationPayload): Promise<{ notificationId: string }> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body || '',
        action_url: payload.actionUrl,
        action_data: (payload.data || {}) as Json,
        sent_via: ['in_app'],
        is_read: false,
        category: payload.category,
        priority: payload.priority || 'normal',
        group_key: payload.groupKey,
        action_label: payload.actionLabel,
        data: { organization_id: payload.organizationId } as Json,
      })
      .select()
      .single();

    if (error) throw error;

    return { notificationId: notification.id };
  }

  // ==========================================
  // SEND BULK NOTIFICATIONS
  // ==========================================

  async sendBulk(
    payload: Omit<NotificationPayload, 'userId'>,
    userIds: string[]
  ): Promise<{ sent: number }> {
    let sent = 0;

    for (const userId of userIds) {
      try {
        await this.send({ ...payload, userId });
        sent++;
      } catch (e) {
        console.error(`Failed to send notification to ${userId}:`, e);
      }
    }

    return { sent };
  }

  // ==========================================
  // PREDEFINED NOTIFICATIONS
  // ==========================================

  async notifyDeadlineApproaching(
    organizationId: string,
    deadline: { id: string; title: string; due_date: string },
    assigneeId: string,
    daysRemaining: number
  ): Promise<void> {
    await this.send({
      organizationId,
      userId: assigneeId,
      type: 'deadline_reminder',
      category: 'deadlines',
      title: `⏰ Deadline en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''}: ${deadline.title}`,
      body: `Tienes un deadline próximo que vence el ${new Date(deadline.due_date).toLocaleDateString('es-ES')}`,
      data: {
        deadline_id: deadline.id,
        deadline_title: deadline.title,
        due_date: deadline.due_date,
        days_remaining: daysRemaining,
      },
      actionUrl: `/app/docket/${deadline.id}`,
      actionLabel: 'Ver Deadline',
      priority: daysRemaining <= 1 ? 'urgent' : daysRemaining <= 3 ? 'high' : 'normal',
      groupKey: `deadline_${deadline.id}`,
    });
  }

  async notifyTaskAssigned(
    organizationId: string,
    task: { id: string; title: string; due_date?: string; priority?: string },
    assigneeId: string,
    assignedByName: string
  ): Promise<void> {
    await this.send({
      organizationId,
      userId: assigneeId,
      type: 'task_assigned',
      category: 'tasks',
      title: `📋 Nueva tarea: ${task.title}`,
      body: `${assignedByName} te ha asignado una tarea`,
      data: {
        task_id: task.id,
        task_title: task.title,
        due_date: task.due_date,
        priority: task.priority,
        assigned_by: assignedByName,
      },
      actionUrl: `/app/tasks/${task.id}`,
      actionLabel: 'Ver Tarea',
      priority: task.priority === 'urgent' ? 'high' : 'normal',
    });
  }

  async notifyMention(
    organizationId: string,
    mentionedUserId: string,
    authorName: string,
    commentPreview: string,
    contextType: string,
    contextId: string,
  ): Promise<void> {
    await this.send({
      organizationId,
      userId: mentionedUserId,
      type: 'comment_mention',
      category: 'comments',
      title: `💬 ${authorName} te ha mencionado`,
      body: commentPreview.substring(0, 100),
      data: {
        author_name: authorName,
        comment_preview: commentPreview,
        context_type: contextType,
        context_id: contextId,
      },
      actionUrl: `/app/${contextType}s/${contextId}#comments`,
      actionLabel: 'Ver Comentario',
      priority: 'normal',
    });
  }

  // ==========================================
  // MANAGEMENT
  // ==========================================

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return count || 0;
  }

  // ==========================================
  // QUIET HOURS CHECK
  // ==========================================

  isInQuietHours(
    quietHoursEnabled: boolean,
    quietHoursStart: string,
    quietHoursEnd: string,
    timezone: string = 'Europe/Madrid'
  ): boolean {
    if (!quietHoursEnabled) return false;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const currentTime = formatter.format(now);
    const [hours, minutes] = currentTime.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;

    const [startH, startM] = quietHoursStart.split(':').map(Number);
    const [endH, endM] = quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

// Singleton export
export const NotificationService = new NotificationServiceClass();
