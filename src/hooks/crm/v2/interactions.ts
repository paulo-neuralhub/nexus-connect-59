// ============================================================
// IP-NEXUS CRM V2 — Interactions → mapped to crm_activities
// This provides backward compatibility for components using
// the old useCRMInteractions API
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";

export function useCRMInteractions(filters?: { account_id?: string; contact_id?: string; deal_id?: string }) {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ["crm-interactions", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      let query = fromTable("crm_activities")
        .select(`
          id, organization_id, account_id, contact_id, deal_id,
          activity_type, subject, description, activity_date,
          duration_minutes, outcome, next_action, next_action_date,
          created_by, created_at,
          account:crm_accounts!account_id(id, name),
          contact:crm_contacts!contact_id(id, full_name),
          deal:crm_deals!deal_id(id, name)
        `)
        .eq("organization_id", organizationId)
        .order("activity_date", { ascending: false });

      if (filters?.account_id) query = query.eq("account_id", filters.account_id);
      if (filters?.contact_id) query = query.eq("contact_id", filters.contact_id);
      if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id);

      const { data, error } = await query;
      if (error) throw error;

      // Map to compat format expected by existing UI
      return (data ?? []).map((row: Record<string, unknown>) => {
        const creator = row.creator as { first_name?: string; last_name?: string } | null;
        return {
          ...row,
          // Compat fields: map activity_type -> channel for old UI
          channel: row.activity_type,
          content: row.description,
          created_at: row.activity_date,
          duration_seconds: row.duration_minutes ? (row.duration_minutes as number) * 60 : null,
          created_by_name: creator ? [creator.first_name, creator.last_name].filter(Boolean).join(' ') : null,
        };
      });
    },
    enabled: !!organizationId,
  });
}

export function useCreateCRMInteraction() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (interaction: Record<string, unknown>) => {
      if (!organizationId) throw new Error("Missing organizationId");
      const { data: { user } } = await supabase.auth.getUser();

      // Map compat fields
      const { data, error } = await fromTable("crm_activities")
        .insert({
          organization_id: organizationId,
          account_id: interaction.account_id ?? null,
          contact_id: interaction.contact_id ?? null,
          deal_id: interaction.deal_id ?? null,
          activity_type: interaction.channel ?? interaction.activity_type ?? 'note',
          subject: interaction.subject ?? null,
          description: interaction.content ?? interaction.description ?? null,
          activity_date: interaction.created_at ?? new Date().toISOString(),
          duration_minutes: interaction.duration_seconds ? Math.round((interaction.duration_seconds as number) / 60) : null,
          outcome: interaction.outcome ?? null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-interactions"] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-dashboard-kpis"] });
      toast({ title: "Actividad registrada" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al crear actividad", description: message, variant: "destructive" });
    },
  });
}
