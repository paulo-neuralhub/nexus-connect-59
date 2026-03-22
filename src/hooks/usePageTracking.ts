// ============================================================
// usePageTracking — Silent tracking hook for copilot-track
// Fire-and-forget page_view events + contextual suggestions
// ============================================================

import { useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';

function getSessionId(): string {
  const key = 'copilot_session_id';
  const dateKey = 'copilot_session_date';
  const today = new Date().toISOString().split('T')[0];
  const stored = sessionStorage.getItem(key);
  const storedDate = sessionStorage.getItem(dateKey);
  if (stored && storedDate === today) return stored;
  const id = `${today}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, id);
  sessionStorage.setItem(dateKey, today);
  return id;
}

export function usePageTracking() {
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    if (!user?.id) return;

    const pathname = location.pathname;
    // Avoid duplicate tracking for same path
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    const matterId = params.id && pathname.includes('/matters/') ? params.id : undefined;
    const crmAccountId = params.id && pathname.includes('/crm/') ? params.id : undefined;
    const invoiceId = params.id && pathname.includes('/finance/invoices/') ? params.id : undefined;

    // Fire-and-forget page_view
    supabase.functions.invoke('copilot-track', {
      body: {
        event_type: 'page_view',
        page_url: pathname,
        session_id: getSessionId(),
        matter_id: matterId || undefined,
        crm_account_id: crmAccountId || undefined,
        invoice_id: invoiceId || undefined,
      },
    }).catch(() => {});

    // Track specific entity opens
    if (matterId && pathname.includes('/matters/')) {
      supabase.functions.invoke('copilot-track', {
        body: {
          event_type: 'matter_opened',
          page_url: pathname,
          session_id: getSessionId(),
          matter_id: matterId,
        },
      }).catch(() => {});
    }

    if (crmAccountId && pathname.includes('/crm/')) {
      supabase.functions.invoke('copilot-track', {
        body: {
          event_type: 'client_opened',
          page_url: pathname,
          session_id: getSessionId(),
          crm_account_id: crmAccountId,
        },
      }).catch(() => {});
    }
  }, [location.pathname, user?.id, params.id]);
}
