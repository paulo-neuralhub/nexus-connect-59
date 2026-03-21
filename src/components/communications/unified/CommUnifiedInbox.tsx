// ============================================================
// IP-NEXUS — Unified Communications Inbox (3-column layout)
// ============================================================

import { useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrganization } from '@/hooks/useOrganization';
import {
  useChannelStats,
  useCommThreads,
  useCommMessages,
  useCommRealtime,
  useCommConfig,
} from '@/hooks/communications';
import type { CommChannel } from '@/types/communications';
import { CommSidebar } from './CommSidebar';
import { CommThreadList } from './CommThreadList';
import { CommThreadDetail } from './CommThreadDetail';
import { CommEmptyState } from './CommEmptyState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function CommUnifiedInbox() {
  const { organizationId } = useOrganization();
  const isMobile = useIsMobile();
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  const [channelFilter, setChannelFilter] = useState<CommChannel | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Data hooks
  const { data: stats = [] } = useChannelStats();
  const { data: threads = [], isLoading: threadsLoading } = useCommThreads(channelFilter);
  const { data: messages = [], isLoading: messagesLoading } = useCommMessages(selectedThreadId);
  const { data: config } = useCommConfig();

  // Realtime — CRITICAL: filtered by org_id
  useCommRealtime(organizationId);

  const selectedThread = threads.find(t => t.id === selectedThreadId) || null;

  const handleSelectThread = useCallback((id: string) => {
    setSelectedThreadId(id);
    if (isMobile) setMobileView('detail');
  }, [isMobile]);

  const handleBackToList = useCallback(() => {
    setMobileView('list');
    setSelectedThreadId(null);
  }, []);

  // ─── Mobile: 1 column ────────────────────────────────────
  if (isMobile) {
    if (mobileView === 'detail' && selectedThread) {
      return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b bg-card">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium truncate">
              {selectedThread.subject || 'Sin asunto'}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CommThreadDetail
              thread={selectedThread}
              messages={messages}
              isLoading={messagesLoading}
              config={config}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <CommThreadList
          threads={threads}
          selectedId={selectedThreadId}
          onSelect={handleSelectThread}
          isLoading={threadsLoading}
          channelFilter={channelFilter}
          onChannelChange={setChannelFilter}
          stats={stats}
        />
      </div>
    );
  }

  // ─── Desktop: 3 columns (sidebar hidden on tablet) ───────
  return (
    <div className="h-[calc(100vh-12rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* Col 1 — Channel sidebar (desktop only) */}
      {!isTablet && (
        <div className="w-[220px] border-r bg-muted/30 flex-shrink-0">
          <CommSidebar
            stats={stats}
            activeChannel={channelFilter}
            onChannelChange={setChannelFilter}
          />
        </div>
      )}

      {/* Col 2 — Thread list */}
      <div className="w-[380px] border-r flex-shrink-0 flex flex-col">
        <CommThreadList
          threads={threads}
          selectedId={selectedThreadId}
          onSelect={handleSelectThread}
          isLoading={threadsLoading}
          channelFilter={channelFilter}
          onChannelChange={isTablet ? setChannelFilter : undefined}
          stats={isTablet ? stats : undefined}
        />
      </div>

      {/* Col 3 — Thread detail */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedThread ? (
          <CommThreadDetail
            thread={selectedThread}
            messages={messages}
            isLoading={messagesLoading}
            config={config}
          />
        ) : (
          <CommEmptyState />
        )}
      </div>
    </div>
  );
}
