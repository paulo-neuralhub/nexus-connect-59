/**
 * Stage change automations — auto-create tasks/activities when deals move stages
 */

import { fromTable } from '@/lib/supabase';
import { toast } from 'sonner';

interface StageAutomationParams {
  dealId: string;
  dealName: string;
  accountId: string | null;
  organizationId: string;
  fromStageName: string | null;
  toStageName: string;
  isWon: boolean;
  isLost: boolean;
  lostReason?: string;
  userId?: string;
}

async function createTask(params: {
  organizationId: string;
  dealId: string;
  title: string;
  dueDays: number;
  userId?: string;
}) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + params.dueDays);

  await fromTable('crm_tasks').insert({
    organization_id: params.organizationId,
    deal_id: params.dealId,
    title: params.title,
    status: 'pending',
    priority: 'medium',
    due_date: dueDate.toISOString(),
    assigned_to: params.userId || null,
  });
}

async function createActivity(params: {
  organizationId: string;
  dealId: string;
  accountId: string | null;
  subject: string;
  activityType: string;
  userId?: string;
}) {
  await fromTable('activities').insert({
    organization_id: params.organizationId,
    deal_id: params.dealId,
    contact_id: null,
    subject: params.subject,
    type: params.activityType,
    created_by: params.userId || null,
  });
}

export async function onDealStageChange(params: StageAutomationParams) {
  const { dealId, dealName, organizationId, toStageName, isWon, isLost, lostReason, userId, accountId } = params;
  const normalized = toStageName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  try {
    // Won stage
    if (isWon) {
      await createActivity({
        organizationId, dealId, accountId,
        subject: `🎉 Deal ganado: ${dealName}`,
        activityType: 'deal_won',
        userId,
      });

      // Update account last_interaction_at
      if (accountId) {
        await fromTable('crm_accounts')
          .update({ last_interaction_at: new Date().toISOString() })
          .eq('id', accountId);
      }

      toast.success('🎉 ¡Deal ganado! Tarea de onboarding creada.');
      return;
    }

    // Lost stage
    if (isLost) {
      await createActivity({
        organizationId, dealId, accountId,
        subject: `❌ Deal perdido: ${dealName}. Motivo: ${lostReason || 'No especificado'}`,
        activityType: 'deal_lost',
        userId,
      });

      await createTask({
        organizationId, dealId,
        title: `Análisis post-mortem: ${dealName}`,
        dueDays: 5, userId,
      });
      return;
    }

    // Briefing-related stages
    if (normalized.includes('briefing') || normalized.includes('analisis') || normalized.includes('contacto inicial')) {
      await createTask({
        organizationId, dealId,
        title: `Preparar briefing con cliente: ${dealName}`,
        dueDays: 3, userId,
      });
    }

    // Proposal stages
    if (normalized.includes('propuesta')) {
      await createTask({
        organizationId, dealId,
        title: `Seguimiento propuesta: ${dealName}`,
        dueDays: 5, userId,
      });
      await createActivity({
        organizationId, dealId, accountId,
        subject: `Propuesta enviada: ${dealName}`,
        activityType: 'note',
        userId,
      });
    }

    // Negotiation stages
    if (normalized.includes('negociacion') || normalized.includes('negociación')) {
      await createTask({
        organizationId, dealId,
        title: `Llamada de negociación: ${dealName}`,
        dueDays: 2, userId,
      });
    }

    // Mandate / Firm stages
    if (normalized.includes('mandato') || normalized.includes('firmado')) {
      await createActivity({
        organizationId, dealId, accountId,
        subject: `Mandato firmado: ${dealName}`,
        activityType: 'note',
        userId,
      });
    }
  } catch (err) {
    console.error('Stage automation error:', err);
    // Don't block the stage change if automations fail
  }
}
