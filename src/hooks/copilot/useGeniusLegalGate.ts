// ============================================================
// useGeniusLegalGate — Hook to check if user has accepted AI terms
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/hooks/useOrganization";

const CURRENT_VERSION = "2026-04-01-v1.0";

export function useGeniusLegalGate() {
  const { user } = useAuth();
  const { organizationId } = useOrganization();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["genius-legal-acceptance", user?.id, organizationId],
    queryFn: async () => {
      if (!user?.id || !organizationId) return null;

      const { data, error } = await supabase
        .from("genius_legal_acceptances" as any)
        .select("id, acceptance_version, accepted_at")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .eq("acceptance_version", CURRENT_VERSION)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!user?.id && !!organizationId,
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  return {
    hasAccepted: !!data,
    isLoading,
    refetch,
    acceptance: data,
    currentVersion: CURRENT_VERSION,
  };
}
