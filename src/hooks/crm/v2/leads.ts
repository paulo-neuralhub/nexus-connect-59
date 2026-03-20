// ============================================================
// IP-NEXUS CRM V2 — Leads hooks (crm_leads)
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import type { CRMLead } from "./types";

export function useCRMLeads(filters?: { search?: string; status?: string | null }) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-leads", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [] as CRMLead[];
      let query = fromTable("crm_leads")
        .select(`
          id, organization_id, full_name, email, phone,
          company_name, source, lead_score, lead_status,
          assigned_to, notes, tags, converted_account_id,
          converted_at, created_at, updated_at
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }
      if (filters?.status) query = query.eq("lead_status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CRMLead[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateCRMLead() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (lead: Record<string, unknown>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await fromTable("crm_leads")
        .insert({
          ...lead,
          organization_id: organizationId,
          lead_status: lead.lead_status ?? "new",
          assigned_to: lead.assigned_to || user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast({ title: "Lead creado" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al crear lead", description: msg, variant: "destructive" });
    },
  });
}
