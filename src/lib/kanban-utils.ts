// ============================================================
// kanban-utils.ts — Validation logic for Kanban stage moves
// ============================================================

// ============================================================
// INTERFACES
// ============================================================

export interface KanbanDeadline {
  matter_id: string;
  title: string;
  deadline_date: string;
  status: 'overdue' | 'pending' | 'completed';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked?: boolean;
}

export interface KanbanStage {
  id: string;
  name: string;
  position: number;
  lock_type: 'free' | 'confirm' | 'matter_driven' | 'admin_only' | 'deadline_blocked' | 'document_required';
  lock_direction: 'bidirectional' | 'forward_only';
  lock_message: string | null;
  requires_matter: boolean;
  entry_checklist: ChecklistItem[];
  allowed_roles: string[];
  is_won_stage: boolean;
  is_lost_stage: boolean;
  matter_status_trigger: string | null;
}

export interface KanbanDeal {
  id: string;
  name: string;
  pipeline_stage_id: string;
  matter_id: string | null;
  organization_id: string;
  stage_history: unknown[];
  stage_entered_at: string | null;
}

export interface MoveValidationResult {
  allowed: boolean;
  reason?: string;
  lockType?: string;
  deadlines?: KanbanDeadline[];
  requiresConfirmation?: boolean;
  confirmMessage?: string;
  checklist?: ChecklistItem[];
  isRoleRestricted?: boolean;
}

// ============================================================
// canMoveToStage — 9 rules in priority order
// ============================================================

export function canMoveToStage(
  deal: KanbanDeal,
  currentStage: KanbanStage,
  targetStage: KanbanStage,
  context: {
    userRole: string | null;
    deadlinesByMatter: Record<string, KanbanDeadline[]>;
    isLoadingDeadlines: boolean;
  }
): MoveValidationResult {
  const { userRole, deadlinesByMatter, isLoadingDeadlines } = context;
  const isMovingBack = targetStage.position < currentStage.position;

  // R0: profile not loaded
  if (userRole === null) {
    return { allowed: false, reason: 'Verificando permisos...', lockType: 'loading' };
  }

  // R0B: deadlines loading (only for deadline_blocked)
  if (isLoadingDeadlines && targetStage.lock_type === 'deadline_blocked') {
    return { allowed: false, reason: 'Verificando plazos del expediente...', lockType: 'loading' };
  }

  // R1: admin_only
  if (targetStage.lock_type === 'admin_only' && userRole !== 'admin') {
    return {
      allowed: false,
      reason: targetStage.lock_message ?? 'Solo administradores.',
      lockType: 'admin_only',
      isRoleRestricted: true,
    };
  }

  // R2: allowed_roles
  if (
    targetStage.allowed_roles?.length > 0 &&
    !targetStage.allowed_roles.includes(userRole) &&
    userRole !== 'admin'
  ) {
    return {
      allowed: false,
      reason: `Tu perfil (${userRole}) no tiene acceso a esta etapa.`,
      lockType: 'role_restricted',
      isRoleRestricted: true,
    };
  }

  // R3: forward_only
  if (isMovingBack && targetStage.lock_direction === 'forward_only') {
    return {
      allowed: false,
      reason: 'No se puede retroceder en este proceso.',
      lockType: 'forward_only',
    };
  }

  // R4: requires_matter without matter_id
  if (targetStage.requires_matter && !deal.matter_id) {
    return {
      allowed: false,
      reason: 'Vincula un expediente al deal antes de continuar.',
      lockType: 'requires_matter',
    };
  }

  // R5: matter_driven
  if (targetStage.lock_type === 'matter_driven') {
    return {
      allowed: false,
      reason: targetStage.lock_message ?? 'Controlado por el expediente.',
      lockType: 'matter_driven',
    };
  }

  // R6: deadline_blocked
  if (targetStage.lock_type === 'deadline_blocked') {
    const overdue = deal.matter_id
      ? (deadlinesByMatter[deal.matter_id] ?? []).filter((d) => d.status === 'overdue')
      : [];
    if (overdue.length > 0) {
      return {
        allowed: false,
        reason: `${overdue.length} plazo(s) vencido(s) bloquean el avance.`,
        lockType: 'deadline_blocked',
        deadlines: overdue,
      };
    }
  }

  // R7: document_required
  if (targetStage.lock_type === 'document_required') {
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmMessage: targetStage.lock_message ?? 'Adjunta el documento requerido.',
      lockType: 'document_required',
    };
  }

  // R8: confirm
  if (targetStage.lock_type === 'confirm') {
    const hasChecklist =
      Array.isArray(targetStage.entry_checklist) && targetStage.entry_checklist.length > 0;
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmMessage: targetStage.lock_message ?? '¿Confirmas el cambio de etapa?',
      lockType: 'confirm',
      checklist: hasChecklist ? targetStage.entry_checklist : undefined,
    };
  }

  // R9: free with entry_checklist
  if (Array.isArray(targetStage.entry_checklist) && targetStage.entry_checklist.length > 0) {
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmMessage: 'Confirma antes de continuar:',
      lockType: 'free_with_checklist',
      checklist: targetStage.entry_checklist,
    };
  }

  return { allowed: true };
}

// ============================================================
// executeStageMove
// ============================================================

export async function executeStageMove(
  deal: KanbanDeal,
  targetStage: KanbanStage,
  context: {
    supabase: any;
    organizationId: string;
    userId: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { supabase, organizationId, userId, notes } = context;
  const now = new Date().toISOString();

  const historyEntry = {
    stage_id: targetStage.id,
    stage_name: targetStage.name,
    entered_at: now,
    moved_by: userId,
    notes: notes ?? null,
  };

  const existingHistory = Array.isArray(deal.stage_history) ? deal.stage_history : [];

  const { error } = await supabase
    .from('crm_deals')
    .update({
      pipeline_stage_id: targetStage.id,
      stage: targetStage.name,
      stage_entered_at: now,
      stage_history: [...existingHistory, historyEntry],
      updated_at: now,
    })
    .eq('id', deal.id)
    .eq('organization_id', organizationId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ============================================================
// logBlockedMove — fire-and-forget, never blocks UI
// ============================================================

export async function logBlockedMove(
  deal: KanbanDeal,
  targetStage: KanbanStage,
  validation: MoveValidationResult,
  context: {
    supabase: any;
    organizationId: string;
    userId: string;
  }
): Promise<void> {
  context.supabase
    .from('crm_automation_executions')
    .insert({
      rule_id: '00000000-0000-0000-0000-000000000001',
      organization_id: context.organizationId,
      deal_id: deal.id,
      trigger_data: {
        attempted_stage_id: targetStage.id,
        attempted_stage_name: targetStage.name,
        blocked_reason: validation.lockType,
        block_message: validation.reason,
        attempted_by: context.userId,
        attempted_at: new Date().toISOString(),
      },
      action_result: { blocked: true },
      status: 'blocked',
      executed_at: new Date().toISOString(),
    })
    .then(() => {})
    .catch((err: unknown) => {
      if (import.meta.env.DEV) {
        console.warn('[KanbanAudit] logBlockedMove failed:', err);
      }
    });
}
