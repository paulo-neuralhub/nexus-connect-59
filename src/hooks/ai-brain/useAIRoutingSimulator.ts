// @ts-nocheck
// ============================================================
// IP-NEXUS AI BRAIN - ROUTING SIMULATOR HOOK
// ============================================================

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskRoutingResult {
  task_id: string;
  task_code: string;
  primary_model_code: string | null;
  primary_provider_code: string | null;
  primary_healthy: boolean;
  backup_1_model_code: string | null;
  backup_1_provider_code: string | null;
  backup_1_healthy: boolean;
  backup_2_model_code: string | null;
  backup_2_provider_code: string | null;
  backup_2_healthy: boolean;
  temperature: number;
  max_tokens: number;
  timeout_ms: number;
}

export interface ModelSelectionResult {
  selected_model_id: string | null;
  selected_model_code: string | null;
  selected_provider_code: string | null;
  is_fallback: boolean;
  fallback_reason: string | null;
  temperature: number;
  max_tokens: number;
  timeout_ms: number;
}

// Get routing configuration for a task
export function useTaskRouting(taskCode: string) {
  return useQuery({
    queryKey: ['ai-task-routing', taskCode],
    queryFn: async (): Promise<TaskRoutingResult | null> => {
      if (!taskCode) return null;

      const { data, error } = await supabase.rpc('get_task_routing', {
        p_task_code: taskCode,
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!taskCode,
  });
}

// Simulate model selection
export function useSimulateModelSelection() {
  return useMutation({
    mutationFn: async ({
      taskCode,
      tenantId,
      requiresVision = false,
      requiresTools = false,
    }: {
      taskCode: string;
      tenantId?: string;
      requiresVision?: boolean;
      requiresTools?: boolean;
    }): Promise<ModelSelectionResult | null> => {
      const { data, error } = await supabase.rpc('select_model_for_task', {
        p_task_code: taskCode,
        p_tenant_id: tenantId || null,
        p_requires_vision: requiresVision,
        p_requires_tools: requiresTools,
      });

      if (error) throw error;
      return data?.[0] || null;
    },
  });
}

// Get all tasks with their routing status
export function useAllTasksRouting() {
  return useQuery({
    queryKey: ['ai-all-tasks-routing'],
    queryFn: async () => {
      // Get all active tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('ai_task_assignments')
        .select(`
          id, task_code, task_name, category, module, is_active,
          primary_model:ai_models!ai_task_assignments_primary_model_id_fkey(
            id, model_id, name,
            provider:ai_providers(id, code, name, health_status, circuit_open)
          ),
          fallback_1:ai_models!ai_task_assignments_fallback_1_model_id_fkey(
            id, model_id, name,
            provider:ai_providers(id, code, name, health_status, circuit_open)
          ),
          fallback_2:ai_models!ai_task_assignments_fallback_2_model_id_fkey(
            id, model_id, name,
            provider:ai_providers(id, code, name, health_status, circuit_open)
          )
        `)
        .eq('is_active', true)
        .order('module')
        .order('task_name');

      if (tasksError) throw tasksError;

      // Enrich with health status
      return tasks?.map(task => {
        const primaryProvider = task.primary_model?.provider as any;
        const backup1Provider = task.fallback_1?.provider as any;
        const backup2Provider = task.fallback_2?.provider as any;

        const primaryHealthy = primaryProvider?.health_status === 'healthy' && !primaryProvider?.circuit_open;
        const backup1Healthy = backup1Provider?.health_status === 'healthy' && !backup1Provider?.circuit_open;
        const backup2Healthy = backup2Provider?.health_status === 'healthy' && !backup2Provider?.circuit_open;

        // Determine which model would be selected
        let selectedModel = task.primary_model;
        let isFallback = false;
        let fallbackReason: string | null = null;

        if (!primaryHealthy) {
          if (task.fallback_1 && backup1Healthy) {
            selectedModel = task.fallback_1;
            isFallback = true;
            fallbackReason = 'primary_unhealthy';
          } else if (task.fallback_2 && backup2Healthy) {
            selectedModel = task.fallback_2;
            isFallback = true;
            fallbackReason = 'backups_exhausted';
          } else {
            fallbackReason = 'no_healthy_options';
          }
        }

        return {
          ...task,
          primaryHealthy,
          backup1Healthy,
          backup2Healthy,
          selectedModel,
          isFallback,
          fallbackReason,
          hasIssue: !primaryHealthy,
        };
      });
    },
    refetchInterval: 30000,
  });
}
