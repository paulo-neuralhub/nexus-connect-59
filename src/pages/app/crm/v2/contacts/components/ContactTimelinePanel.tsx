import * as React from "react";
import { ContactTimeline } from "@/pages/app/crm/v2/contacts/components/ContactTimeline";

export interface ContactTimelinePanelProps {
  contactId: string;
  organizationId: string;
  accountId?: string | null;
}

export function ContactTimelinePanel({ contactId, accountId }: ContactTimelinePanelProps) {
  return <ContactTimeline contactId={contactId} accountId={accountId} />;
}

