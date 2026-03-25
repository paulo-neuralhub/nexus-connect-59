// ============================================================
// IP-NEXUS — Urgency Banner for critical incoming messages
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInboxMessages } from '@/hooks/use-inbox';
import { X, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UrgencyBanner() {
  const navigate = useNavigate();
  const { data: messages = [] } = useInboxMessages();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const criticalMessages = messages.filter(
    m => (m.ai_urgency_score ?? 0) >= 9 && !dismissed.has(m.id) && m.status !== 'archived' && m.status !== 'replied'
  );

  if (criticalMessages.length === 0) return null;

  const msg = criticalMessages[0];

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-3 text-sm animate-in slide-in-from-top">
      <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
      <span className="flex-1 truncate">
        🚨 Mensaje urgente de <strong>{msg.sender_name}</strong>
        {msg.account?.name && ` (${msg.account.name})`}
        {msg.subject && ` — ${msg.subject}`}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:text-white hover:bg-white/20 text-xs h-7"
        onClick={() => navigate('/app/communications')}
      >
        Ver <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
      <button
        onClick={() => setDismissed(s => new Set([...s, msg.id]))}
        className="p-1 hover:bg-white/20 rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
