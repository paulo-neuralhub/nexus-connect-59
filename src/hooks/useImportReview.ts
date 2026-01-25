import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

export interface ReviewItem {
  id: string;
  import_id: string;
  matter_id?: string;
  matter_ref?: string;
  office_code: string;
  extracted_data: Record<string, unknown>;
  current_data: Record<string, unknown>;
  confidence_score: number;
  fields_to_review: string[];
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  created_at: string;
  import_file_name?: string;
}

export interface ReviewItemDetail extends ReviewItem {
  document_url?: string;
}

export function useImportReview() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Get review queue - mock data for now until table exists
  const { data: reviewQueue = [], isLoading } = useQuery({
    queryKey: ['import-review-queue', currentOrganization?.id],
    queryFn: async (): Promise<ReviewItem[]> => {
      if (!currentOrganization?.id) return [];

      // TODO: Replace with actual query when import_review_queue table exists
      // For now return demo data
      return [
        {
          id: 'review-1',
          import_id: 'demo-1',
          matter_id: undefined,
          matter_ref: 'UK00003456789',
          office_code: 'UKIPO',
          extracted_data: {
            status: 'Registered',
            registration_date: '2025-01-15',
            applicant: 'ACME Corp',
          },
          current_data: {
            status: 'Published',
            registration_date: null,
            applicant: 'ACME Corporation',
          },
          confidence_score: 72,
          fields_to_review: ['status', 'applicant'],
          status: 'pending',
          created_at: new Date(Date.now() - 300000).toISOString(),
          import_file_name: 'boletín-ukipo-enero-2025.xlsx',
        },
        {
          id: 'review-2',
          import_id: 'demo-1',
          matter_id: undefined,
          matter_ref: 'UK00003456790',
          office_code: 'UKIPO',
          extracted_data: {
            application_number: 'UK000345???',
            status: 'Reg???ered',
            applicant: 'A?ME Co?p',
          },
          current_data: {},
          confidence_score: 45,
          fields_to_review: ['application_number', 'status', 'applicant'],
          status: 'pending',
          created_at: new Date(Date.now() - 300000).toISOString(),
          import_file_name: 'boletín-ukipo-enero-2025.xlsx',
        },
      ];
    },
    enabled: !!currentOrganization?.id,
  });

  // Get single review item detail
  const getReviewItem = async (id: string): Promise<ReviewItemDetail | null> => {
    const item = reviewQueue.find(r => r.id === id);
    if (!item) return null;
    return { ...item, document_url: undefined };
  };

  // Approve item
  const approveMutation = useMutation({
    mutationFn: async ({ id, finalData }: { id: string; finalData?: Record<string, unknown> }) => {
      // TODO: Implement actual approval when table exists
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      toast.success('Registro aprobado y actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al aprobar: ${error.message}`);
    },
  });

  // Reject item
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      // TODO: Implement actual rejection when table exists
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-review-queue'] });
      toast.success('Registro rechazado');
    },
    onError: (error: Error) => {
      toast.error(`Error al rechazar: ${error.message}`);
    },
  });

  // Bulk approve
  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // TODO: Implement actual bulk approval when table exists
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['import-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      toast.success(`${ids.length} registros aprobados`);
    },
    onError: (error: Error) => {
      toast.error(`Error al aprobar: ${error.message}`);
    },
  });

  // Bulk reject
  const bulkRejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // TODO: Implement actual bulk rejection when table exists
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['import-review-queue'] });
      toast.success(`${ids.length} registros rechazados`);
    },
    onError: (error: Error) => {
      toast.error(`Error al rechazar: ${error.message}`);
    },
  });

  return {
    reviewQueue,
    isLoading,
    getReviewItem,
    approveItem: approveMutation.mutateAsync,
    rejectItem: rejectMutation.mutateAsync,
    bulkApprove: bulkApproveMutation.mutateAsync,
    bulkReject: bulkRejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
