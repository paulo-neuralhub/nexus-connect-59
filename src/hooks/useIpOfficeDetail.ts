/**
 * Hook to fetch a single IP office by code with all details
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIpOfficeByCode(code: string | undefined) {
  return useQuery({
    queryKey: ["ip-office-by-code", code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .from("ipo_offices")
        .select("*")
        .eq("code", code)
        .single();
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    enabled: !!code,
  });
}
