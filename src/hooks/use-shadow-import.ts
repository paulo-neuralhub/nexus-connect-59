import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import type { ImportJob, ShadowComparison, JobConfig } from '@/types/universal-import';

export function useShadowImport() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sourceId?: string;
      fileIds?: string[];
      config: {
        entities: string[];
        fieldMapping: Record<string, any>;
        options?: Record<string, any>;
      };
    }): Promise<ImportJob> => {
      if (!currentOrganization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('execute-shadow-import', {
        body: {
          organization_id: currentOrganization.id,
          ...params,
          job_type: 'shadow_sync'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      toast.success('Simulación iniciada', {
        description: 'Los resultados estarán disponibles en unos minutos'
      });
    },
    onError: (error: Error) => {
      toast.error(`Error al iniciar simulación: ${error.message}`);
    }
  });
}

export function useShadowComparison(jobId: string) {
  return useQuery({
    queryKey: ['shadow-comparison', jobId],
    queryFn: async (): Promise<ShadowComparison | null> => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('shadow_data, shadow_comparison')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data.shadow_comparison as unknown as ShadowComparison;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Keep polling if comparison not ready yet
      const data = query.state.data;
      return !data ? 3000 : false;
    }
  });
}

export function useApplyShadowImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shadowJobId: string) => {
      const { data, error } = await supabase.functions.invoke('apply-shadow-import', {
        body: { shadow_job_id: shadowJobId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['matters'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Importación aplicada correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al aplicar importación: ${error.message}`);
    }
  });
}

export function useValidateShadowData(jobId: string) {
  return useQuery({
    queryKey: ['shadow-validation', jobId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('validate-shadow-data', {
        body: { job_id: jobId }
      });

      if (error) throw error;
      return data as {
        isValid: boolean;
        errors: Array<{
          entity: string;
          field: string;
          message: string;
          rowNumber?: number;
        }>;
        warnings: Array<{
          entity: string;
          message: string;
          affectedCount: number;
        }>;
        qualityScore: number;
      };
    },
    enabled: !!jobId
  });
}
