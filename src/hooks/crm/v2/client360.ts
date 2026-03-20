// ============================================================
// IP-NEXUS CRM V2 — Client 360 hook
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { rpcFn } from "@/lib/supabase";

export interface Client360Data {
  account: unknown;
  contacts: unknown[];
  deals: unknown[];
  interactions: unknown[];
}

export function useClient360(accountId: string | undefined) {
  return useQuery({
    queryKey: ["client-360", accountId],
    queryFn: async () => {
      const { data, error } = await rpcFn("crm_get_client_360", { p_account_id: accountId });
      if (error) throw error;
      return data as unknown as Client360Data;
    },
    enabled: !!accountId,
  });
}
