import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

export interface ImportableOffice {
  id: string;
  code: string;
  name: string;
  country_code?: string;
  flag_emoji?: string;
  accepted_formats: string[];
  has_template: boolean;
  template_url?: string;
}

export interface ImportRecord {
  id: string;
  office_code: string;
  office_name?: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  import_status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  records_found: number;
  records_imported: number;
  records_updated: number;
  records_failed: number;
  requires_review: boolean;
  review_count?: number;
  created_at: string;
  processed_at?: string;
}

export interface ImportResult {
  success: boolean;
  import_id?: string;
  records_found?: number;
  records_imported?: number;
  records_failed?: number;
  requires_review?: boolean;
  review_count?: number;
  error?: string;
}

function getFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function useFileImport() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Get offices that support file import
  const { data: importableOffices = [], isLoading: loadingOffices } = useQuery({
    queryKey: ['importable-offices'],
    queryFn: async (): Promise<ImportableOffice[]> => {
      const { data, error } = await supabase
        .from('ipo_offices')
        .select('*')
        .eq('is_active', true)
        .in('data_source_type', ['file_import', 'manual', 'mixed']);

      if (error) throw error;

      return (data || []).map(office => ({
        id: office.id,
        code: office.code,
        name: office.name_official,
        country_code: office.country_code || undefined,
        flag_emoji: getFlagEmoji(office.country_code || undefined),
        accepted_formats: ['xlsx', 'csv', 'pdf'],
        has_template: true,
        template_url: `/templates/import-${office.code.toLowerCase()}.xlsx`,
      }));
    },
  });

  // Get import history - mock data for now until table exists
  const { data: importHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['import-history', currentOrganization?.id],
    queryFn: async (): Promise<ImportRecord[]> => {
      if (!currentOrganization?.id) return [];

      // TODO: Replace with actual query when file_imports table exists
      // For now return demo data
      return [
        {
          id: 'demo-1',
          office_code: 'UKIPO',
          office_name: 'UK Intellectual Property Office',
          file_name: 'boletín-ukipo-enero-2025.xlsx',
          file_type: 'xlsx',
          file_size: 245000,
          import_status: 'completed',
          records_found: 55,
          records_imported: 45,
          records_updated: 8,
          records_failed: 2,
          requires_review: true,
          review_count: 8,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          processed_at: new Date(Date.now() - 3500000).toISOString(),
        },
      ];
    },
    enabled: !!currentOrganization?.id,
  });

  // Upload and process file
  const uploadFileMutation = useMutation({
    mutationFn: async ({ officeId, file }: { officeId: string; file: File }): Promise<ImportResult> => {
      if (!currentOrganization?.id) throw new Error('No organization');

      // Find office
      const office = importableOffices.find(o => o.id === officeId);
      if (!office) throw new Error('Oficina no encontrada');

      // Upload file to storage first
      const filePath = `${currentOrganization.id}/imports/${Date.now()}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('matter-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Call edge function to process
      const response = await supabase.functions.invoke('process-file-import', {
        body: { 
          tenantId: currentOrganization.id,
          officeCode: office.code,
          filePath,
          fileName: file.name,
          fileType: file.name.split('.').pop() || 'unknown',
          fileSize: file.size,
        },
      });

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        };
      }

      return response.data as ImportResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      if (result.success) {
        toast.success(`Importación completada: ${result.records_imported || 0} registros`);
      } else {
        toast.error(`Error en importación: ${result.error}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al importar: ${error.message}`);
    },
  });

  return {
    importableOffices,
    importHistory,
    isLoading: loadingOffices || loadingHistory,
    uploadFile: uploadFileMutation.mutateAsync,
    isUploading: uploadFileMutation.isPending,
  };
}
