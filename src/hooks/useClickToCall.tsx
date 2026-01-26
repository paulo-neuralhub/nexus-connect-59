// ============================================================
// IP-NEXUS - Click to Call Hook
// ============================================================

import { useCallback } from 'react';

declare global {
  interface Window {
    softphoneCall?: (number: string, contactId?: string, contactName?: string) => void;
  }
}

interface CallOptions {
  name?: string;
  company?: string;
  clientId?: string;
  contactId?: string;
  matterId?: string;
  onCallInitiated?: () => void;
  onCallCompleted?: () => void;
}

export function useClickToCall() {
  const call = useCallback((phoneNumber: string, options?: CallOptions) => {
    // Try the custom event system first (CallManager)
    const event = new CustomEvent("ip-nexus:initiate-call", {
      detail: {
        phone: phoneNumber,
        name: options?.name,
        company: options?.company,
        clientId: options?.clientId,
        contactId: options?.contactId,
        matterId: options?.matterId,
        onCallInitiated: options?.onCallInitiated,
        onCallCompleted: options?.onCallCompleted,
      },
    });
    window.dispatchEvent(event);
  }, []);

  // Legacy call function for compatibility
  const legacyCall = useCallback((phoneNumber: string, contactId?: string, contactName?: string) => {
    if (window.softphoneCall) {
      window.softphoneCall(phoneNumber, contactId, contactName);
      return;
    }

    // Use new system
    call(phoneNumber, { contactId, name: contactName });
  }, [call]);

  return { call, legacyCall };
}

export function ClickToCallNumber({
  number,
  contactId,
  contactName,
  company,
  matterId,
  className,
}: {
  number: string;
  contactId?: string;
  contactName?: string;
  company?: string;
  matterId?: string;
  className?: string;
}) {
  const { call } = useClickToCall();

  return (
    <button
      type="button"
      onClick={() => call(number, { contactId, name: contactName, company, matterId })}
      className={className ?? 'text-primary hover:underline'}
    >
      {number}
    </button>
  );
}
