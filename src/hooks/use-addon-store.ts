/**
 * useAddonStore — Hook para el catálogo de Add-ons de IP-NEXUS
 * Fuente única de datos: billing_addons + organization_addons + tenant_feature_flags
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";

// ── Types ──────────────────────────────────────────────
export interface BillingAddon {
  code: string;
  name_es: string;
  description_es: string | null;
  category: string;
  price_monthly_eur: number;
  price_annual_eur: number;
  icon_name: string | null;
  color_hex: string | null;
  compatible_plan_codes: string[];
  feature_flags_granted: Record<string, unknown>;
  min_plan_tier: number;
  sort_order: number;
  max_per_org: number;
  is_contracted: boolean;
  annual_saving_eur: number;
  adds_jurisdictions: number;
  adds_matters: number;
  adds_users: number;
}

export type AddonState = "active" | "available" | "incompatible" | "redundant";

export interface OrgPlan {
  plan_code: string;
  plan_name: string;
  monthly_price_eur: number;
  annual_price_eur: number;
  billing_cycle: string;
  is_in_trial: boolean;
  max_jurisdictions: number;
  max_matters: number;
  max_users: number;
}

interface AddonStoreResult {
  addons: BillingAddon[];
  orgPlan: OrgPlan | null;
  activeAddons: BillingAddon[];
  isLoading: boolean;
  error: Error | null;
  getAddonsByCategory: (category: string) => BillingAddon[];
  getAddonState: (addon: BillingAddon) => AddonState;
}

export function useAddonStore(): AddonStoreResult {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["addon-store", user?.id],
    queryFn: async (): Promise<{ addons: BillingAddon[]; orgPlan: OrgPlan | null }> => {
      if (!user?.id) return { addons: [], orgPlan: null };

      // 1. Get organizationId from memberships
      const { data: membership, error: memErr } = await supabase
        .from("memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (memErr || !membership?.organization_id) {
        // Fallback: try from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (!profile?.organization_id) {
          return { addons: [], orgPlan: null };
        }
        return fetchStoreData(profile.organization_id);
      }

      return fetchStoreData(membership.organization_id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const addons = query.data?.addons ?? [];
  const orgPlan = query.data?.orgPlan ?? null;
  const activeAddons = addons.filter((a) => a.is_contracted);

  const getAddonsByCategory = (category: string) =>
    addons.filter((a) => a.category === category);

  const getAddonState = (addon: BillingAddon): AddonState => {
    // 1. Ya contratado
    if (addon.is_contracted) return "active";

    // 2. REDUNDANCIA — siempre antes de incompatible
    if (addon.category === "jurisdiction_pack") {
      const planHasUnlimitedJur = (orgPlan?.max_jurisdictions ?? 0) === -1;
      const hasGlobalPack = activeAddons.some((a) => a.adds_jurisdictions === -1);
      if (planHasUnlimitedJur || hasGlobalPack) return "redundant";
    }
    if (addon.adds_matters > 0) {
      if ((orgPlan?.max_matters ?? 0) >= 999999) return "redundant";
    }
    if (addon.adds_users > 0) {
      if ((orgPlan?.max_users ?? 0) >= 999999) return "redundant";
    }
    const INTEL_RANK: Record<string, number> = {
      iparadar_starter: 1,
      iparadar_pro: 2,
      iparadar_enterprise: 3,
    };
    if (INTEL_RANK[addon.code] !== undefined) {
      const currentLevel = Math.max(0, ...activeAddons.map((a) => INTEL_RANK[a.code] ?? 0));
      if (INTEL_RANK[addon.code] <= currentLevel) return "redundant";
    }

    // 3. Incompatible con plan actual
    if (!addon.compatible_plan_codes.includes(orgPlan?.plan_code ?? "free")) return "incompatible";

    // 4. Disponible
    return "available";
  };

  return {
    addons,
    orgPlan,
    activeAddons,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    getAddonsByCategory,
    getAddonState,
  };
}

// ── Internal fetch logic ───────────────────────────────
async function fetchStoreData(
  organizationId: string
): Promise<{ addons: BillingAddon[]; orgPlan: OrgPlan | null }> {
  const [catalogResult, activeResult, planResult] = await Promise.allSettled([
    // A) All active billing addons
    supabase
      .from("billing_addons")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("sort_order"),

    // B) Active addons for this org (with billing_addons join)
    supabase
      .from("organization_addons")
      .select(`addon_code, status, billing_addons!inner(adds_jurisdictions, adds_matters, adds_users, category, code)`)
      .eq("organization_id", organizationId)
      .eq("status", "active"),

    // C) Plan info
    fetchPlanInfo(organizationId),
  ]);

  // Parse catalog
  const catalog: any[] =
    catalogResult.status === "fulfilled" && catalogResult.value.data
      ? catalogResult.value.data
      : [];

  // Parse active addon codes + enrichment data
  const activeAddonRows: Array<{ addon_code: string; adds_jurisdictions: number; adds_matters: number; adds_users: number }> =
    activeResult.status === "fulfilled" && activeResult.value.data
      ? activeResult.value.data.map((a: any) => ({
          addon_code: a.addon_code,
          adds_jurisdictions: (a.billing_addons as any)?.adds_jurisdictions ?? 0,
          adds_matters: (a.billing_addons as any)?.adds_matters ?? 0,
          adds_users: (a.billing_addons as any)?.adds_users ?? 0,
        }))
      : [];
  const activeAddonCodes = activeAddonRows.map((a) => a.addon_code);

  // Parse plan
  const orgPlan: OrgPlan | null =
    planResult.status === "fulfilled" ? planResult.value : null;

  // Build enriched addons
  const addons: BillingAddon[] = catalog.map((row: any) => {
    const isContracted = activeAddonCodes.includes(row.code);
    const monthlyPrice = Number(row.price_monthly_eur) || 0;
    const annualPrice = Number(row.price_annual_eur) || 0;
    const annualSaving = (monthlyPrice - annualPrice) * 12;
    const activeRow = activeAddonRows.find((a) => a.addon_code === row.code);

    return {
      code: row.code,
      name_es: row.name_es ?? row.name ?? row.code,
      description_es: row.description_es ?? null,
      category: row.category ?? "module_standalone",
      price_monthly_eur: monthlyPrice,
      price_annual_eur: annualPrice,
      icon_name: row.icon_name ?? null,
      color_hex: row.color_hex ?? "#64748B",
      compatible_plan_codes: row.compatible_plan_codes ?? [],
      feature_flags_granted: row.feature_flags_granted ?? {},
      min_plan_tier: row.min_plan_tier ?? 0,
      sort_order: row.sort_order ?? 99,
      max_per_org: row.max_per_org ?? 1,
      is_contracted: isContracted,
      annual_saving_eur: annualSaving > 0 ? annualSaving : 0,
      adds_jurisdictions: activeRow?.adds_jurisdictions ?? Number(row.adds_jurisdictions) ?? 0,
      adds_matters: activeRow?.adds_matters ?? Number(row.adds_matters) ?? 0,
      adds_users: activeRow?.adds_users ?? Number(row.adds_users) ?? 0,
    };
  });

  return { addons, orgPlan };
}

async function fetchPlanInfo(organizationId: string): Promise<OrgPlan | null> {
  try {
    const { data: flags } = await supabase
      .from("tenant_feature_flags")
      .select("current_plan_code, current_billing_cycle, is_in_trial")
      .eq("organization_id", organizationId)
      .single();

    const planCode = flags?.current_plan_code ?? "free";
    const billingCycle = flags?.current_billing_cycle ?? "monthly";
    const isInTrial = flags?.is_in_trial ?? false;

    // Fetch plan details
    const { data: planDef } = await supabase
      .from("plan_definitions")
      .select("code, name, monthly_price_eur, annual_price_eur, max_jurisdictions, max_matters, max_users")
      .eq("code", planCode)
      .single();

    return {
      plan_code: planCode,
      plan_name: planDef?.name ?? planCode,
      monthly_price_eur: Number(planDef?.monthly_price_eur) ?? 0,
      annual_price_eur: Number(planDef?.annual_price_eur) ?? 0,
      billing_cycle: billingCycle,
      is_in_trial: isInTrial,
      max_jurisdictions: Number(planDef?.max_jurisdictions) ?? 0,
      max_matters: Number(planDef?.max_matters) ?? 0,
      max_users: Number(planDef?.max_users) ?? 0,
    };
  } catch {
    return {
      plan_code: "free",
      plan_name: "Free",
      monthly_price_eur: 0,
      annual_price_eur: 0,
      billing_cycle: "monthly",
      is_in_trial: false,
      max_jurisdictions: 1,
      max_matters: 25,
      max_users: 2,
    };
  }
}
