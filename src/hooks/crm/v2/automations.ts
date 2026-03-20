// ============================================================
// IP-NEXUS CRM V2 — Automations hooks (crm_automation_rules)
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";

// ── Types ──

export interface AutomationRule {
  id: string;
  organization_id: string;
  pipeline_id: string | null;
  stage_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  deal_id: string | null;
  account_id: string | null;
  trigger_data: Record<string, unknown>;
  action_result: Record<string, unknown>;
  status: string;
  error_message: string | null;
  executed_at: string;
  rule?: { id: string; name: string } | null;
}

// ── Queries ──

export function useCRMAutomationRules(filters?: { stage_id?: string; pipeline_id?: string }) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-automation-rules", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [] as AutomationRule[];
      let query = fromTable("crm_automation_rules")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (filters?.stage_id) query = query.eq("stage_id", filters.stage_id);
      if (filters?.pipeline_id) query = query.eq("pipeline_id", filters.pipeline_id);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AutomationRule[];
    },
    enabled: !!organizationId,
  });
}

export function useCRMAutomationExecutions(filters?: { rule_id?: string; limit?: number }) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-automation-executions", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [] as AutomationExecution[];
      let query = fromTable("crm_automation_executions")
        .select("*, rule:crm_automation_rules!rule_id(id, name)")
        .eq("organization_id", organizationId)
        .order("executed_at", { ascending: false })
        .limit(filters?.limit ?? 10);

      if (filters?.rule_id) query = query.eq("rule_id", filters.rule_id);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AutomationExecution[];
    },
    enabled: !!organizationId,
  });
}

// ── Mutations ──

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rule: Partial<AutomationRule>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data, error } = await fromTable("crm_automation_rules")
        .insert({ ...rule, organization_id: organizationId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-automation-rules"] });
      toast({ title: "Automatización creada" });
    },
    onError: (err: unknown) => {
      toast({ title: "Error al crear automatización", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    },
  });
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { id: string; data: Partial<AutomationRule> }) => {
      const { data, error } = await fromTable("crm_automation_rules")
        .update(params.data)
        .eq("id", params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-automation-rules"] });
      toast({ title: "Automatización actualizada" });
    },
    onError: (err: unknown) => {
      toast({ title: "Error al actualizar", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    },
  });
}

export function useDeleteAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await fromTable("crm_automation_rules").delete().eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-automation-rules"] });
      toast({ title: "Automatización eliminada" });
    },
    onError: (err: unknown) => {
      toast({ title: "Error al eliminar", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    },
  });
}

// ── Execution engine ──

interface ExecutionContext {
  dealId: string;
  accountId?: string | null;
  dealName?: string;
  accountName?: string;
  organizationId: string;
  stageId?: string;
  triggerType: string;
  triggerData?: Record<string, unknown>;
}

/**
 * Execute all matching automation rules for a trigger event.
 * Uses Promise.allSettled so one failure doesn't block others.
 */
export async function executeAutomations(ctx: ExecutionContext) {
  const { organizationId, stageId, triggerType, dealId, accountId, triggerData = {} } = ctx;

  // 1. Fetch matching active rules
  let query = fromTable("crm_automation_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("trigger_type", triggerType)
    .eq("is_active", true);

  // stage-specific OR global (stage_id IS NULL)
  if (stageId) {
    query = query.or(`stage_id.eq.${stageId},stage_id.is.null`);
  }

  const { data: rules, error } = await query;
  if (error || !rules?.length) return [];

  // 2. Execute each rule
  const results = await Promise.allSettled(
    (rules as AutomationRule[]).map(async (rule) => {
      try {
        const actionResult = await executeSingleAction(rule, ctx);

        // Log success
        await fromTable("crm_automation_executions").insert({
          rule_id: rule.id,
          organization_id: organizationId,
          deal_id: dealId,
          account_id: accountId ?? null,
          trigger_data: triggerData,
          action_result: actionResult,
          status: "success",
        });

        // Increment counter
        await fromTable("crm_automation_rules")
          .update({
            execution_count: (rule.execution_count ?? 0) + 1,
            last_executed_at: new Date().toISOString(),
          })
          .eq("id", rule.id);

        return { ruleId: rule.id, status: "success" as const, result: actionResult };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        // Log failure
        await fromTable("crm_automation_executions").insert({
          rule_id: rule.id,
          organization_id: organizationId,
          deal_id: dealId,
          account_id: accountId ?? null,
          trigger_data: triggerData,
          action_result: {},
          status: "failed",
          error_message: errorMsg,
        }).catch(() => {}); // Don't fail if logging fails

        return { ruleId: rule.id, status: "failed" as const, error: errorMsg };
      }
    })
  );

  return results;
}

async function executeSingleAction(
  rule: AutomationRule,
  ctx: ExecutionContext
): Promise<Record<string, unknown>> {
  const { organizationId, dealId, accountId, dealName, accountName } = ctx;
  const config = rule.action_config ?? {};
  const { data: { user } } = await supabase.auth.getUser();

  switch (rule.action_type) {
    case "create_task": {
      const title = ((config.title as string) ?? "Tarea automática")
        .replace("{{account_name}}", accountName ?? "Cliente")
        .replace("{{deal_name}}", dealName ?? "Deal");
      const daysDue = (config.days_due as number) ?? 3;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysDue);

      const { data, error } = await fromTable("crm_tasks").insert({
        organization_id: organizationId,
        account_id: accountId ?? null,
        deal_id: dealId,
        title,
        status: "pending",
        priority: "high",
        due_date: dueDate.toISOString().split("T")[0],
        assigned_to: user?.id,
        created_by: user?.id,
      }).select("id").single();
      if (error) throw error;
      return { task_id: data.id, title };
    }

    case "create_activity": {
      const { data, error } = await fromTable("crm_activities").insert({
        organization_id: organizationId,
        account_id: accountId ?? null,
        deal_id: dealId,
        activity_type: (config.activity_type as string) ?? "note",
        subject: (config.title as string) ?? `Actividad automática: ${rule.name}`,
        description: (config.description as string) ?? `Generada por regla: ${rule.name}`,
        activity_date: new Date().toISOString(),
        created_by: user?.id,
      }).select("id").single();
      if (error) throw error;
      return { activity_id: data.id };
    }

    case "send_notification": {
      const message = (config.message as string) ?? `Automatización: ${rule.name}`;
      const { data, error } = await fromTable("notifications").insert({
        user_id: user?.id,
        organization_id: organizationId,
        title: rule.name,
        message,
        type: "crm_automation",
        is_read: false,
      }).select("id").single();
      if (error) throw error;
      return { notification_id: data.id };
    }

    case "generate_document": {
      // Placeholder — document generation is a future integration
      return { status: "pending", message: "Generación de documento programada", template: config.template };
    }

    case "ai_suggest": {
      // Insert a pending AI suggestion for the CoPilot
      const { data, error } = await fromTable("crm_ai_suggestions").insert({
        organization_id: organizationId,
        user_id: user?.id,
        context_type: "deal",
        context_id: dealId,
        suggestion_type: (config.suggestion_type as string) ?? "opportunity",
        priority: (config.priority as string) ?? "medium",
        title: rule.name,
        body: rule.description ?? "Sugerencia generada por automatización",
        action_label: "Ver deal",
        action_type: "open_deal",
        action_data: { deal_id: dealId, account_id: accountId },
      }).select("id").single();
      if (error) throw error;
      return { suggestion_id: data.id };
    }

    default:
      return { status: "skipped", reason: `Unknown action_type: ${rule.action_type}` };
  }
}

// ── Hook for components to trigger automations ──

export function useExecuteAutomations() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();

  return useMutation({
    mutationFn: async (params: {
      dealId: string;
      accountId?: string | null;
      dealName?: string;
      accountName?: string;
      stageId?: string;
      triggerType: string;
      triggerData?: Record<string, unknown>;
    }) => {
      if (!organizationId) throw new Error("Missing organizationId");
      return executeAutomations({ ...params, organizationId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-automation-executions"] });
      queryClient.invalidateQueries({ queryKey: ["crm-automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-ai-suggestions"] });
    },
  });
}
