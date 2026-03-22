// ============================================================
// IP-NEXUS — Internal Chat Layout (3-column: sidebar / messages / detail)
// Phase 3 UI — Replaces old CommInternalChat
// ============================================================

import { useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrganization } from '@/hooks/useOrganization';
import {
  useInternalChannels,
  useInternalMessages,
  useSendInternalMessage,
  useInternalChatRealtime,
  useHeartbeat,
  useCurrentProfile,
  useStaffNotifications,
} from '@/hooks/communications/use-internal-chat';
import { ChannelSidebar } from './ChannelSidebar';
import { MessagePane } from './MessagePane';
import { ChatEmptyState } from './ChatEmptyState';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function InternalChatLayout() {
  const { organizationId } = useOrganization();
  const isMobile = useIsMobile();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'channels' | 'chat'>('channels');

  // Data
  const { data: channels = [], isLoading: channelsLoading } = useInternalChannels();
  const { data: messages = [], isLoading: messagesLoading } = useInternalMessages(activeChannelId);
  const { data: profile } = useCurrentProfile();
  const { data: notifications = [] } = useStaffNotifications();
  const sendMessage = useSendInternalMessage();

  // Realtime + heartbeat
  useInternalChatRealtime(organizationId, activeChannelId);
  useHeartbeat('online');

  const activeChannel = channels.find(c => c.id === activeChannelId) || null;

  const handleSelectChannel = useCallback((id: string) => {
    setActiveChannelId(id);
    if (isMobile) setMobileView('chat');
  }, [isMobile]);

  const handleBack = useCallback(() => {
    setMobileView('channels');
    setActiveChannelId(null);
  }, []);

  const handleSend = useCallback((content: string) => {
    if (!activeChannelId) return;
    sendMessage.mutate({
      channel_id: activeChannelId,
      content,
      referenced_matter_id: activeChannel?.matter_id || undefined,
    });
  }, [activeChannelId, activeChannel, sendMessage]);

  // ─── Mobile ──────────────────────────────────────────────
  if (isMobile) {
    if (mobileView === 'chat' && activeChannel) {
      return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-card">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium truncate">{activeChannel.name}</span>
          </div>
          <MessagePane
            channel={activeChannel}
            messages={messages}
            isLoading={messagesLoading}
            onSend={handleSend}
            isSending={sendMessage.isPending}
            currentUserId={profile?.id}
            notifications={notifications}
          />
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-8rem)]">
        <ChannelSidebar
          channels={channels}
          activeId={activeChannelId}
          onSelect={handleSelectChannel}
          isLoading={channelsLoading}
          notifications={notifications}
        />
      </div>
    );
  }

  // ─── Desktop ─────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-12rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* Channel sidebar */}
      <div className="w-[260px] border-r flex-shrink-0">
        <ChannelSidebar
          channels={channels}
          activeId={activeChannelId}
          onSelect={handleSelectChannel}
          isLoading={channelsLoading}
          notifications={notifications}
        />
      </div>

      {/* Message pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <MessagePane
            channel={activeChannel}
            messages={messages}
            isLoading={messagesLoading}
            onSend={handleSend}
            isSending={sendMessage.isPending}
            currentUserId={profile?.id}
            notifications={notifications}
          />
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div>
  );
}
