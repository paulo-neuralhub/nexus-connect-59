// src/hooks/finance/useServicesCatalog.ts
// Hook for services catalog (system + tenant-specific)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface ServiceCatalogEntry {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  category: string;
  invoice_item_type: string;
  default_price: number | null;
  default_currency: string;
  default_unit: string;
  default_vat_rate_pct: number | null;
  default_irpf_rate_pct: number | null;
  applicable_jurisdictions: string[];
  nice_classes: number[];
  is_active: boolean;
  is_system_template: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useServicesCatalog() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['services-catalog', currentOrganization?.id],
    queryFn: async () => {
      const orgId = currentOrganization?.id;

      // Get system templates + tenant's own services
      let query = supabase
        .from('services_catalog')
        .select('*')
        .eq('is_active', true)
        .order('is_system_template', { ascending: false })
        .order('category')
        .order('sort_order');

      if (orgId) {
        query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
      } else {
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceCatalogEntry[];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: Partial<ServiceCatalogEntry>) => {
      const { data: service, error } = await supabase
        .from('services_catalog')
        .insert({
          organization_id: currentOrganization!.id,
          code: data.code || '',
          name: data.name || '',
          category: data.category || 'other',
          invoice_item_type: data.invoice_item_type || 'professional_fee',
          default_price: data.default_price,
          default_currency: data.default_currency || 'EUR',
          default_unit: data.default_unit || 'service',
          default_vat_rate_pct: data.default_vat_rate_pct,
          default_irpf_rate_pct: data.default_irpf_rate_pct,
          is_system_template: false,
        })
        .select()
        .single();

      if (error) throw error;
      return service as ServiceCatalogEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast.success('Servicio creado');
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceCatalogEntry> }) => {
      const { data: service, error } = await supabase
        .from('services_catalog')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return service as ServiceCatalogEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast.success('Servicio actualizado');
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services_catalog')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast.success('Servicio eliminado');
    },
  });
}
