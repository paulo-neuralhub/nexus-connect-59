import React, { useState } from 'react';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';
import { useOrganization } from '@/hooks/useOrganization';
import { HeroBriefing } from '@/components/briefing/HeroBriefing';
import { BriefingChatTab } from '@/components/briefing/BriefingChatTab';
import { Loader2, Sparkles, FileText } from 'lucide-react';

const TABS = [
  { id: 'briefing', label: 'Briefing', icon: FileText },
  { id: 'chat', label: '✨ Chat IA', icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]['id'];

const BriefingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('briefing');
  const { briefing, loading, generating, generateBriefing, content } =
    useMorningBriefing();
  const { organizationId } = useOrganization();

  return (
    <div style={{ background: '#EEF2F7', minHeight: '100%' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-8 pt-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'briefing' && (
        <>
          {(loading || generating) ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  {generating
                    ? '🤖 IP-GENIUS generando tu briefing...'
                    : 'Cargando briefing...'}
                </p>
              </div>
            </div>
          ) : briefing && content ? (
            <HeroBriefing
              content={content}
              briefing={briefing}
              onRefresh={() => generateBriefing(true)}
            />
          ) : null}
        </>
      )}

      {activeTab === 'chat' && organizationId && (
        <div className="px-8 py-4">
          <div
            className="bg-background rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '4px 4px 10px #cdd1dc, -4px -4px 10px #ffffff',
            }}
          >
            <BriefingChatTab organizationId={organizationId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefingPage;
