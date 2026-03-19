/**
 * Hook para el Directorio Mundial de Oficinas IP
 * Adaptado de UmbrellaBrandsV2 al design system SILK de IP-NEXUS
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ═══ Core IP Office type ═══
export interface IpOffice {
  [key: string]: unknown;
  id: string;
  code: string;
  name: string;
  name_official?: string | null;
  name_short?: string | null;
  name_es?: string | null;
  office_acronym?: string | null;
  country_code?: string | null;
  country_name?: string | null;
  country_flag?: string | null;
  flag_emoji?: string | null;
  region?: string | null;
  office_type?: string | null;
  city?: string | null;
  digitalization_level?: string | null;
  automation_level?: string | null;
  automation_percentage?: number | null;
  digital_maturity_score?: number | null;
  data_completeness_score?: number | null;
  handles_trademarks?: boolean | null;
  handles_patents?: boolean | null;
  handles_designs?: boolean | null;
  handles_utility_models?: boolean | null;
  member_madrid_protocol?: boolean | null;
  tm_estimated_registration_months?: number | null;
  requires_local_agent?: boolean | null;
  agent_requirement_type?: string | null;
  website_official?: string | null;
  website_main?: string | null;
  website_search?: string | null;
  has_api?: boolean | null;
  e_filing_available?: boolean | null;
  is_active?: boolean | null;
  supported_ip_types?: string[] | null;
  acronym?: string | null;
  official_name_local?: string | null;
  website_url?: string | null;
}

export interface OfficeCommercialData {
  pj_is_active: boolean;
  price_tier: 'real' | 'suggested' | 'none';
  price_total: number | null;
  price_currency: string | null;
  margin_pct: number | null;
  suggested_total: number | null;
  official_fee: number | null;
  official_fee_currency: string | null;
  price_confidence: string | null;
  fee_verified_date: string | null;
  fee_source_url: string | null;
}

export type IpOfficeWithCommercial = IpOffice & { commercial: OfficeCommercialData | null };

export function parseLanguages(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

const LEVEL_MAP: Record<string, string> = {
  'A': 'FULL_DIGITAL', 'B': 'AVANZADA', 'C': 'PARCIAL', 'D': 'BASICA', 'E': 'MANUAL',
  'FULL_DIGITAL': 'FULL_DIGITAL', 'AVANZADA': 'AVANZADA', 'PARCIAL': 'PARCIAL',
  'BASICA': 'BASICA', 'MANUAL': 'MANUAL',
};

export function useIpOfficesDirectory() {
  return useQuery({
    queryKey: ["ip-offices-directory-unified"],
    queryFn: async () => {
      const { data: offices, error } = await (supabase
        .from("ipo_offices" as any)
        .select("*")
        .eq("is_active", true)
        .order("priority_score", { ascending: true, nullsFirst: false })
        .order("country_name", { ascending: true }) as any);
      if (error) throw error;

      // Fee intelligence
      const { data: feeIntelData } = await (supabase
        .from("jurisdiction_change_patterns" as any)
        .select("ipo_office_id")
        .not("ipo_office_id", "is", null) as any);
      const feeIntelSet = new Set((feeIntelData ?? []).map((r: any) => r.ipo_office_id));

      return ((offices as any[]) || []).map((raw: any) => {
        const ipTypes: string[] = Array.isArray(raw.supported_ip_types) ? raw.supported_ip_types : [];
        const mappedLevel = LEVEL_MAP[raw.digitalization_level || raw.automation_level] || 'MANUAL';
        
        const office: IpOffice = {
          ...raw,
          official_name_local: raw.name_official || raw.name,
          acronym: raw.office_acronym || raw.name_short || raw.name_es,
          name: raw.name_official || raw.name_short || raw.country_name || raw.code,
          country_name: raw.country_name,
          country_flag: raw.flag_emoji || raw.country_flag || "🏛️",
          handles_trademarks: raw.handles_trademarks || ipTypes.includes('trademark'),
          handles_patents: raw.handles_patents || ipTypes.includes('patent'),
          handles_designs: raw.handles_designs || ipTypes.includes('design'),
          handles_utility_models: raw.handles_utility_models || ipTypes.includes('utility_model'),
          digitalization_level: mappedLevel,
          automation_percentage: raw.automation_percentage ?? 0,
          digital_maturity_score: raw.digital_maturity_score ?? (raw.automation_percentage ? Math.round(raw.automation_percentage / 10) : 0),
          member_madrid_protocol: raw.member_madrid_protocol ?? false,
          data_completeness_score: raw.data_completeness_score ?? 0,
          website_main: raw.website_official || raw.website_main,
          website_url: raw.website_official,
        };

        const commercial: OfficeCommercialData = {
          pj_is_active: false,
          price_tier: 'none',
          price_total: null,
          price_currency: null,
          margin_pct: null,
          suggested_total: null,
          official_fee: raw.tm_filing_fee ?? null,
          official_fee_currency: raw.tm_fee_currency ?? null,
          price_confidence: null,
          fee_verified_date: null,
          fee_source_url: null,
        };

        return { ...office, commercial, has_fee_intelligence: feeIntelSet.has(office.id) } as IpOfficeWithCommercial;
      });
    },
  });
}
