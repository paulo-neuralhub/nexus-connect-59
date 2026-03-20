/**
 * CRM Account Detail — Tab: Documentos
 * Placeholder that delegates to existing component if available
 */

import { ClientDocumentsTab } from "@/components/clients/ClientDocumentsTab";

interface Props {
  accountId: string;
}

export function AccountDocumentsTab({ accountId }: Props) {
  return <ClientDocumentsTab clientId={accountId} />;
}
