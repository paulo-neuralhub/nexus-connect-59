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
          id, organization_id, full_name, email, phone, whatsapp_phone,
          company_name, source, lead_score, lead_status,
          assigned_to, notes, tags, converted_account_id,
          converted_at, created_at, updated_at
        `)
        .eq("organization_id", organizationId)
        .is("converted_at", null)
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
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Lead creado" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al crear lead", description: msg, variant: "destructive" });
    },
  });
}

/**
 * Convert a lead → creates crm_account + crm_contact, marks lead as converted
 */
export function useConvertLead() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { leadId: string; accountName: string }) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Get lead data
      const { data: lead, error: leadErr } = await fromTable("crm_leads")
        .select("*")
        .eq("id", params.leadId)
        .eq("organization_id", organizationId)
        .single();
      if (leadErr) throw leadErr;

      // 2. Create account
      const { data: account, error: accErr } = await fromTable("crm_accounts")
        .insert({
          organization_id: organizationId,
          name: params.accountName || lead.company_name || lead.full_name,
          lifecycle_stage: "customer",
          assigned_to: lead.assigned_to || user?.id,
          is_active: true,
        })
        .select("id")
        .single();
      if (accErr) throw accErr;

      // 3. Create contact linked to account
      const { error: contactErr } = await fromTable("crm_contacts")
        .insert({
          organization_id: organizationId,
          account_id: account.id,
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          whatsapp_phone: lead.whatsapp_phone,
          is_primary: true,
          assigned_to: lead.assigned_to || user?.id,
        })
        .select()
        .single();
      if (contactErr) throw contactErr;

      // 4. Mark lead as converted
      const { error: updateErr } = await fromTable("crm_leads")
        .update({
          converted_account_id: account.id,
          converted_at: new Date().toISOString(),
          lead_status: "converted",
        })
        .eq("id", params.leadId);
      if (updateErr) throw updateErr;

      return { accountId: account.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Lead convertido", description: "Cuenta y contacto creados." });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al convertir lead", description: msg, variant: "destructive" });
    },
  });
}
