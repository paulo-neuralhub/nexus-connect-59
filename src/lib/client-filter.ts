/**
 * Dual client filter for the client_id → crm_account_id migration.
 * Use this everywhere we need to filter by account/client.
 * Matches rows where EITHER client_id OR crm_account_id equals the given accountId.
 */
export function dualClientFilter(accountId: string): string {
  return `client_id.eq.${accountId},crm_account_id.eq.${accountId}`;
}
