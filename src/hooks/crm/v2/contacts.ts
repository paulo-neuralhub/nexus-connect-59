// ============================================================
// IP-NEXUS CRM V2 — Contacts hooks (crm_contacts)
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import type { CRMContact, ContactFilters } from "./types";

export function useCRMContacts(filters?: ContactFilters) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-contacts", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [] as CRMContact[];
      let query = fromTable("crm_contacts")
        .select(`
          id, organization_id, account_id, full_name, email, phone,
          whatsapp_phone, job_title, role, is_primary, is_lead,
          lead_score, lead_status, country_code, city, tags, notes,
          assigned_to, last_interaction_at, created_at,
          account:crm_accounts!account_id(id, name)
        `)
        .eq("organization_id", organizationId)
        .order("full_name", { ascending: true });

      if (filters?.account_id) query = query.eq("account_id", filters.account_id);
      if (filters?.role) query = query.eq("role", filters.role);
      if (filters?.country_code) query = query.eq("country_code", filters.country_code);
      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CRMContact[];
    },
    enabled: !!organizationId,
  });
}

export function useCRMContact(id: string | undefined) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-contact", id],
    queryFn: async () => {
      if (!organizationId || !id) return null;
      const { data, error } = await fromTable("crm_contacts")
        .select(`*, account:crm_accounts!account_id(id, name)`)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single();
      if (error) throw error;
      return data as CRMContact;
    },
    enabled: !!organizationId && !!id,
  });
}

export function useCreateCRMContact() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contact: Record<string, unknown>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data, error } = await fromTable("crm_contacts")
        .insert({ ...contact, organization_id: organizationId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-account"] });
      toast({ title: "Contacto creado" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al crear contacto", description: msg, variant: "destructive" });
    },
  });
}
