// ============================================================
// IP-NEXUS CRM V2 — Accounts hooks (crm_accounts)
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import type { CRMAccount, AccountFilters } from "./types";

export function useCRMAccounts(filters?: AccountFilters) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-accounts", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [] as CRMAccount[];

      let query = fromTable("crm_accounts")
        .select(
          `id, name, legal_name, tax_id, client_token, account_type, vat_number,
           country_code, city, industry, ip_portfolio_size,
           annual_ip_budget_eur, status, tier, health_score, rating_stars,
           lifecycle_stage, assigned_to, tags, is_active,
           last_interaction_at, created_at, updated_at,
           assigned_user:profiles!assigned_to(id, first_name, last_name, avatar_url)`
        )
        .eq("organization_id", organizationId);

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,tax_id.ilike.%${filters.search}%,legal_name.ilike.%${filters.search}%`
        );
      }
      if (filters?.lifecycle_stage) query = query.eq("lifecycle_stage", filters.lifecycle_stage);
      if (filters?.account_type) query = query.eq("account_type", filters.account_type);
      if (filters?.is_active !== undefined) query = query.eq("is_active", filters.is_active);

      const orderCol = filters?.order_by ?? "name";
      query = query.order(orderCol, { ascending: filters?.order_asc ?? true });

      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CRMAccount[];
    },
    enabled: !!organizationId,
    staleTime: 30_000,
  });
}

/** Single account — returns flat account object (backward compat) */
export function useCRMAccount(id: string | undefined) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-account", organizationId, id],
    queryFn: async () => {
      if (!organizationId || !id) return null;
      const { data, error } = await fromTable("crm_accounts")
        .select(`*, assigned_user:profiles!assigned_to(id, first_name, last_name, avatar_url)`)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error) throw error;
      return data as CRMAccount | null;
    },
    enabled: !!organizationId && !!id,
  });
}

/** Full account detail with related entities */
export function useCRMAccountDetail(id: string | undefined) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-account-detail", id],
    queryFn: async () => {
      if (!organizationId || !id) return null;

      const [accountRes, contactsRes, dealsRes, activitiesRes, mattersRes] = await Promise.all([
        fromTable("crm_accounts")
          .select(`*, assigned_user:profiles!assigned_to(id, first_name, last_name, avatar_url)`)
          .eq("id", id)
          .eq("organization_id", organizationId)
          .maybeSingle(),
        fromTable("crm_contacts")
          .select("id, full_name, email, phone, job_title, role, is_primary")
          .eq("account_id", id)
          .eq("organization_id", organizationId)
          .order("is_primary", { ascending: false }),
        fromTable("crm_deals")
          .select(`id, name, stage, amount_eur, probability_pct, expected_close_date, pipeline_stage_id,
                   pipeline_stage:crm_pipeline_stages!pipeline_stage_id(id, name, color, is_won_stage, is_lost_stage)`)
          .eq("account_id", id)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),
        fromTable("crm_activities")
          .select(`id, activity_type, subject, description, activity_date,
                   contact:crm_contacts!contact_id(id, full_name),
                   creator:profiles!created_by(id, first_name, last_name)`)
          .eq("account_id", id)
          .eq("organization_id", organizationId)
          .order("activity_date", { ascending: false })
          .limit(10),
        fromTable("matters")
          .select("id", { count: "exact", head: true })
          .or(`client_id.eq.${id},crm_account_id.eq.${id}`)
          .eq("organization_id", organizationId),
      ]);

      if (accountRes.error) throw accountRes.error;
      if (!accountRes.data) return null;

      return {
        account: accountRes.data as CRMAccount,
        contacts: contactsRes.data ?? [],
        deals: dealsRes.data ?? [],
        activities: activitiesRes.data ?? [],
        mattersCount: mattersRes.count ?? 0,
      };
    },
    enabled: !!organizationId && !!id,
  });
}

export function useCreateCRMAccount() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (account: Record<string, unknown>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await fromTable("crm_accounts")
        .insert({
          ...account,
          organization_id: organizationId,
          assigned_to: account.assigned_to || user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-accounts"] });
      toast({ title: "Cuenta creada" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al crear cuenta", description: msg, variant: "destructive" });
    },
  });
}

export function useUpdateCRMAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await fromTable("crm_accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["crm-account"] });
      queryClient.invalidateQueries({ queryKey: ["crm-accounts"] });
      toast({ title: "Cuenta actualizada" });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al actualizar cuenta", description: msg, variant: "destructive" });
    },
  });
}
