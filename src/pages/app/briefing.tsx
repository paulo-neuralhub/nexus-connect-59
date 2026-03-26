import React from 'react';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';
import { HeroBriefing } from '@/components/briefing/HeroBriefing';
import { Loader2 } from 'lucide-react';

const BriefingPage: React.FC = () => {
  const { briefing, loading, generating, generateBriefing, resolveItem, content } =
    useMorningBriefing();

  if (loading || generating) {
    return (
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
    );
  }

  if (!briefing || !content) return null;

  return (
    <div className="-m-6">
      <HeroBriefing
        content={content}
        briefing={briefing}
        onRefresh={() => generateBriefing(true)}
      />
    </div>
  );
};

export default BriefingPage;
