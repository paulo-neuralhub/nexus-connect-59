// ============================================================
// IP-NEXUS - Softphone Contact Search Hook
// Searches crm_accounts and crm_contacts for phone/name matches
// with debounce for efficient querying
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/contexts/organization-context";
import { useDebounce } from "@/hooks/use-debounce";

export interface SoftphoneSearchResult {
  id: string;
  type: "account" | "contact";
  display_name: string;
  phone: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  account_id: string | null;
  account_name: string | null;
  active_matters_count: number;
}

function normalizePhone(input: string): string {
  return input.replace(/[\s()\-.+]/g, "");
}

export function useSoftphoneSearch(query: string) {
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;

  // Debounce 300ms
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: ["softphone-search", organizationId, debouncedQuery],
    queryFn: async (): Promise<SoftphoneSearchResult[]> => {
      if (!organizationId || !debouncedQuery || debouncedQuery.length < 3) {
        return [];
      }

      const normalizedPhone = normalizePhone(debouncedQuery);
      const lowerQuery = debouncedQuery.toLowerCase();
      const results: SoftphoneSearchResult[] = [];

      // 1. Search in crm_accounts (companies/clients)
      try {
        const { data: accounts } = await fromTable("crm_accounts")
          .select("id, name, phone, email, website")
          .eq("organization_id", organizationId)
          .or(
            `name.ilike.%${lowerQuery}%,phone.ilike.%${normalizedPhone}%`
          )
          .limit(5);

        if (accounts) {
          // Get matter counts for these accounts
          const accountIds = accounts.map((a: any) => a.id);
          
          let matterCounts: Record<string, number> = {};
          if (accountIds.length > 0) {
            const { data: matters } = await fromTable("matters")
              .select("client_id, crm_account_id")
              .or(accountIds.map(id => `client_id.eq.${id},crm_account_id.eq.${id}`).join(','))
              .not("status", "in", "(closed,archived)");
            
            if (matters) {
              matters.forEach((m: any) => {
                matterCounts[m.client_id] = (matterCounts[m.client_id] || 0) + 1;
              });
            }
          }

          for (const acc of accounts) {
            results.push({
              id: acc.id,
              type: "account",
              display_name: acc.name || "Sin nombre",
              phone: acc.phone || null,
              whatsapp_phone: null,
              email: acc.email || null,
              account_id: acc.id,
              account_name: acc.name || null,
              active_matters_count: matterCounts[acc.id] || 0,
            });
          }
        }
      } catch (e) {
        console.error("Error searching crm_accounts:", e);
      }

      // 2. Search in crm_contacts (individual contacts)
      try {
        const { data: contacts } = await fromTable("crm_contacts")
          .select("id, full_name, email, phone, whatsapp_phone, account_id")
          .eq("organization_id", organizationId)
          .or(
            `full_name.ilike.%${lowerQuery}%,phone.ilike.%${normalizedPhone}%,whatsapp_phone.ilike.%${normalizedPhone}%`
          )
          .limit(5);

        if (contacts) {
          // Get account names for contacts
          const accountIds = [...new Set(contacts.filter((c: any) => c.account_id).map((c: any) => c.account_id))];
          
          let accountNames: Record<string, string> = {};
          let matterCounts: Record<string, number> = {};
          
          if (accountIds.length > 0) {
            const { data: accs } = await fromTable("crm_accounts")
              .select("id, name")
              .in("id", accountIds);
            
            if (accs) {
              accs.forEach((a: any) => {
                accountNames[a.id] = a.name;
              });
            }

            const { data: matters } = await fromTable("matters")
              .select("client_id")
              .in("client_id", accountIds)
              .not("status", "in", "(closed,archived)");
            
            if (matters) {
              matters.forEach((m: any) => {
                matterCounts[m.client_id] = (matterCounts[m.client_id] || 0) + 1;
              });
            }
          }

          for (const contact of contacts) {
            results.push({
              id: contact.id,
              type: "contact",
              display_name: contact.full_name || "Sin nombre",
              phone: contact.phone || null,
              whatsapp_phone: contact.whatsapp_phone || null,
              email: contact.email || null,
              account_id: contact.account_id || null,
              account_name: contact.account_id ? accountNames[contact.account_id] || null : null,
              active_matters_count: contact.account_id ? matterCounts[contact.account_id] || 0 : 0,
            });
          }
        }
      } catch (e) {
        console.error("Error searching crm_contacts:", e);
      }

      // Sort: prioritize exact phone matches, then by matter count
      return results.sort((a, b) => {
        const aPhoneMatch = (a.phone && normalizePhone(a.phone).includes(normalizedPhone)) ? 1 : 0;
        const bPhoneMatch = (b.phone && normalizePhone(b.phone).includes(normalizedPhone)) ? 1 : 0;
        
        if (aPhoneMatch !== bPhoneMatch) return bPhoneMatch - aPhoneMatch;
        return b.active_matters_count - a.active_matters_count;
      }).slice(0, 10);
    },
    enabled: !!organizationId && debouncedQuery.length >= 3,
    staleTime: 30000,
  });
}
