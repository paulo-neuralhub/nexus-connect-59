// ============================================================
// IP-NEXUS — Inbox grouped-by-matter hook
// ============================================================

import { useMemo } from 'react';
import type { InboxMessage } from '@/hooks/use-inbox';

export interface MatterGroup {
  matterId: string | null;
  matter: { id: string; reference?: string; title?: string; type?: string; status?: string; jurisdiction_code?: string } | null;
  messages: InboxMessage[];
  lastMessage: InboxMessage;
  maxUrgency: number;
  senders: string[];
}

export function useInboxGrouped(messages: InboxMessage[]): MatterGroup[] {
  return useMemo(() => {
    const map = new Map<string, MatterGroup>();

    for (const msg of messages) {
      const key = msg.matter_id || '__unlinked__';
      const existing = map.get(key);
      if (existing) {
        existing.messages.push(msg);
        existing.maxUrgency = Math.max(existing.maxUrgency, msg.ai_urgency_score || 0);
        const name = msg.sender_name || msg.sender_email || '';
        if (name && !existing.senders.includes(name)) existing.senders.push(name);
        if (msg.created_at && existing.lastMessage.created_at && msg.created_at > existing.lastMessage.created_at) {
          existing.lastMessage = msg;
        }
      } else {
        // Extract matter info from the message's joined data
        const matterInfo = (msg as any).matter;
        map.set(key, {
          matterId: msg.matter_id,
          matter: matterInfo || null,
          messages: [msg],
          lastMessage: msg,
          maxUrgency: msg.ai_urgency_score || 0,
          senders: [msg.sender_name || msg.sender_email || ''].filter(Boolean),
        });
      }
    }

    const groups = Array.from(map.values());

    // Sort: maxUrgency DESC, then lastMessage date DESC
    groups.sort((a, b) => {
      if (b.maxUrgency !== a.maxUrgency) return b.maxUrgency - a.maxUrgency;
      const da = a.lastMessage.created_at || '';
      const db = b.lastMessage.created_at || '';
      return db.localeCompare(da);
    });

    // Move unlinked group to the end
    const unlinkedIdx = groups.findIndex(g => !g.matterId);
    if (unlinkedIdx > 0) {
      const [unlinked] = groups.splice(unlinkedIdx, 1);
      groups.push(unlinked);
    }

    return groups;
  }, [messages]);
}
