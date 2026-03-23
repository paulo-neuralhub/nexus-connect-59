import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GeniusChatEnhanced, ConversationSidebar } from '@/components/features/genius';
import type { AgentType, AIConversation } from '@/types/genius';
import { usePageTitle } from '@/contexts/page-context';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FeatureGuide } from '@/components/help';
import { useContextualHelp } from '@/hooks/useContextualHelp';

export default function GeniusPage() {
  const { featureKey, currentGuide, shouldShowGuide } = useContextualHelp();
  const { setTitle } = usePageTitle();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [conversationId, setConversationId] = useState<string | undefined>(
    searchParams.get('conversation') || undefined
  );
  
  useEffect(() => {
    setTitle('IP-GENIUS');
  }, [setTitle]);
  
  const handleSelectConversation = (conv: AIConversation) => {
    setConversationId(conv.id);
    setSearchParams({ conversation: conv.id });
    setSidebarOpen(false);
  };
  
  const handleNewChat = () => {
    setConversationId(undefined);
    setSearchParams({});
    setSidebarOpen(false);
  };
  
  const handleConversationChange = (id: string) => {
    setConversationId(id);
    setSearchParams({ conversation: id });
  };

  return (
    <div className="space-y-4">
      {currentGuide && shouldShowGuide(featureKey) ? (
        <FeatureGuide featureKey={featureKey} title={currentGuide.title} steps={currentGuide.steps} />
      ) : null}

      <div className="h-[calc(100vh-10rem)] flex rounded-[14px] border border-border/50 bg-card overflow-hidden">
        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden absolute top-4 left-4 z-10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        {/* Sidebar */}
        <div className={cn(
          "w-72 flex-shrink-0 border-r bg-muted/30 transition-all duration-300",
          "lg:block",
          sidebarOpen 
            ? "fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto animate-slide-in-right" 
            : "hidden"
        )}>
          <ConversationSidebar
            agentType="legal"
            selectedId={conversationId}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        </div>
        
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Chat — IP-GENIUS orchestrates dynamically */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <GeniusChatEnhanced
              key={conversationId || 'new'}
              agentType="legal"
              initialConversationId={conversationId}
              onConversationChange={handleConversationChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
