import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { fromTable } from "@/lib/supabase";

export interface CurrencyPrefs {
  mode: "reference_only" | "tenant_only" | "jurisdiction_only" | "reference_and_jurisdiction" | "all_three";
  reference_currency: string;
  show_rate_timestamp: boolean;
}

const DEFAULT_PREFS: CurrencyPrefs = {
  mode: "reference_and_jurisdiction",
  reference_currency: "USD",
  show_rate_timestamp: true,
};

export function useCurrencyPreferences() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const { data: prefs } = useQuery<CurrencyPrefs>({
    queryKey: ["currency-prefs", user?.id],
    queryFn: async () => {
      if (!user?.id) return DEFAULT_PREFS;
      const { data, error } = await fromTable("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();
      if (error || !data) return DEFAULT_PREFS;
      const cd = (data.preferences as Record<string, unknown> | null)?.currency_display as Partial<CurrencyPrefs> | undefined;
      return { ...DEFAULT_PREFS, ...cd };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const orgCurrency =
    ((currentOrganization?.settings as Record<string, unknown> | null)?.default_currency as string) ?? "EUR";

  return {
    prefs: prefs ?? DEFAULT_PREFS,
    orgCurrency,
  };
}
