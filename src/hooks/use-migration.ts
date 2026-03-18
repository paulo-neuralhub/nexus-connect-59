import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import type {
  MigrationProject,
  MigrationFile,
  MigrationTemplate,
  MigrationLog,
  SourceSystem,
  MigrationEntityType,
} from '@/types/migration';

// =====================================================
// PROYECTOS DE MIGRACIÓN
// =====================================================

export function useMigrationProjects() {
  const { currentOrganization: organization } = useOrganization();
  
  return useQuery({
    queryKey: ['migration-projects', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('migration_projects')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as MigrationProject[];
    },
    enabled: !!organization?.id,
  });
}

export function useMigrationProject(id: string) {
  return useQuery({
    queryKey: ['migration-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('migration_projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as unknown as MigrationProject;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as MigrationProject | undefined;
      if (data?.status === 'migrating' || data?.status === 'validating') {
        return 2000;
      }
      return false;
    },
  });
}

export function useCreateMigrationProject() {
  const queryClient = useQueryClient();
  const { currentOrganization: organization } = useOrganization();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      source_system: SourceSystem;
    }) => {
      const { data, error } = await supabase
        .from('migration_projects')
        .insert({
          organization_id: organization!.id,
          created_by: user!.id,
          ...input,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MigrationProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration-projects'] });
      toast.success('Proyecto de migración creado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useUpdateMigrationProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      id: string;
      updates: Partial<MigrationProject>;
    }) => {
      const { data, error } = await supabase
        .from('migration_projects')
        .update({
          ...input.updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MigrationProject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['migration-project', data.id] });
      queryClient.invalidateQueries({ queryKey: ['migration-projects'] });
    },
  });
}

export function useDeleteMigrationProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('migration_projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration-projects'] });
      toast.success('Proyecto eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// =====================================================
// ARCHIVOS DE MIGRACIÓN
// =====================================================

export function useMigrationFiles(projectId: string) {
  return useQuery({
    queryKey: ['migration-files', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('migration_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as unknown as MigrationFile[];
    },
    enabled: !!projectId,
  });
}

export function useUploadMigrationFile() {
  const queryClient = useQueryClient();
  const { currentOrganization: organization } = useOrganization();
  
  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      file: File;
      entityType: MigrationEntityType;
    }) => {
      // 1. Subir archivo
      const fileExt = input.file.name.split('.').pop()?.toLowerCase();
      const filePath = `migrations/${input.projectId}/${Date.now()}_${input.file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('migrations')
        .upload(filePath, input.file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('migrations')
        .getPublicUrl(filePath);
      
      // 2. Crear registro
      const { data, error } = await supabase
        .from('migration_files')
        .insert({
          project_id: input.projectId,
          organization_id: organization!.id,
          file_name: input.file.name,
          file_url: urlData.publicUrl,
          file_size: input.file.size,
          file_format: fileExt as any,
          entity_type: input.entityType,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 3. Analizar archivo
      await supabase.functions.invoke('analyze-migration-file', {
        body: { file_id: data.id }
      });
      
      return data as unknown as MigrationFile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['migration-files', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['migration-project', data.project_id] });
      toast.success('Archivo subido y analizando...');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useUpdateFileMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: {
      fileId: string;
      column_mapping: Record<string, string>;
      transformations?: Record<string, Record<string, string>>;
    }) => {
      const { data, error } = await supabase
        .from('migration_files')
        .update({
          column_mapping: input.column_mapping,
          transformations: input.transformations || {},
        })
        .eq('id', input.fileId)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MigrationFile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['migration-files', data.project_id] });
      toast.success('Mapeo actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useValidateMigrationFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileId: string) => {
      const { data, error } = await supabase.functions.invoke('validate-migration-file', {
        body: { file_id: fileId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration-files'] });
      toast.success('Validación completada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useDeleteMigrationFile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { fileId: string; projectId: string }) => {
      const { error } = await supabase
        .from('migration_files')
        .delete()
        .eq('id', input.fileId);
      
      if (error) throw error;
      return input;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['migration-files', data.projectId] });
      toast.success('Archivo eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// =====================================================
// TEMPLATES DE MAPEO
// =====================================================

export function useMigrationTemplates(sourceSystem?: SourceSystem, entityType?: MigrationEntityType) {
  return useQuery({
    queryKey: ['migration-templates', sourceSystem, entityType],
    queryFn: async () => {
      let query = supabase
        .from('migration_templates')
        .select('*');
      
      if (sourceSystem) {
        query = query.eq('source_system', sourceSystem);
      }
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as MigrationTemplate[];
    },
  });
}

// =====================================================
// LOGS DE MIGRACIÓN
// =====================================================

export function useMigrationLogs(projectId: string) {
  return useQuery({
    queryKey: ['migration-logs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('migration_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as unknown as MigrationLog[];
    },
    enabled: !!projectId,
  });
}

// =====================================================
// EJECUTAR MIGRACIÓN
// =====================================================

export function useExecuteMigration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase.functions.invoke('execute-migration', {
        body: { project_id: projectId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['migration-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['migration-projects'] });
      toast.success('Migración iniciada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useCancelMigration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('migration_projects')
        .update({ status: 'cancelled' })
        .eq('id', projectId);
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['migration-project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['migration-projects'] });
      toast.success('Migración cancelada');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// =====================================================
// AUTO-MAPEO CON AI
// =====================================================

export function useAutoMapColumns() {
  return useMutation({
    mutationFn: async (input: {
      fileId: string;
      sourceColumns: string[];
      targetFields: string[];
      sampleData: any[];
    }) => {
      const { data, error } = await supabase.functions.invoke('auto-map-columns', {
        body: input
      });
      
      if (error) throw error;
      return data as {
        mapping: Record<string, string>;
        confidence: Record<string, number>;
        suggestions: string[];
      };
    },
    onSuccess: () => {
      toast.success('Mapeo automático completado');
    },
    onError: (error: Error) => {
      toast.error(`Error en auto-mapeo: ${error.message}`);
    },
  });
}
