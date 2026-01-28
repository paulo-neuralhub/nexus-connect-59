import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";

export function useCRMAccounts(filters?: { search?: string }) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-accounts", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      let query = fromTable("crm_accounts")
        .select(`
          id, name, legal_name, tax_id, city, country, 
          status, tier, health_score, client_type, 
          payment_classification, rating, tags,
          total_invoiced, contact_count, matter_count,
          primary_contact_name, primary_contact_phone, primary_contact_email
        `)
        .eq("organization_id", organizationId)
        .order("name", { ascending: true });

      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}

export function useCRMAccount(id: string) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-account", organizationId, id],
    queryFn: async () => {
      if (!organizationId || !id) return null;
      const { data, error } = await fromTable("crm_accounts")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && !!id,
  });
}
