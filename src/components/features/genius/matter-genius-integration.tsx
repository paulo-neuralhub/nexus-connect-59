/**
 * Matter Genius Tab — Integration in MatterDetailPage
 * Shows Genius features linked to a specific matter
 */
import { useState } from 'react';
import { Sparkles, FileText, MessageSquare, Zap, Brain, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GeniusChat } from '@/components/features/genius/chat';

interface Props {
  matterId: string;
  matterReference?: string;
}

export function MatterGeniusIntegration({ matterId, matterReference }: Props) {
  const { currentOrganization } = useOrganization();
  const [activeView, setActiveView] = useState<'overview' | 'chat' | 'generate'>('overview');

  // Generated docs for this matter
  const { data: docs = [] } = useQuery({
    queryKey: ['matter-genius-docs', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genius_generated_docs')
        .select('*')
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!matterId,
  });

  // Conversations linked to this matter
  const { data: conversations = [] } = useQuery({
    queryKey: ['matter-genius-conversations', matterId],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('matter_id', matterId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!matterId && !!currentOrganization?.id,
  });

  // Proactive suggestions for this matter
  const { data: suggestions = [] } = useQuery({
    queryKey: ['matter-genius-suggestions', matterId],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('genius_messages')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('content_type', 'proactive')
        .eq('action_status', 'pending')
        .limit(5);
      if (error) throw error;
      // Filter suggestions that mention this matter (basic heuristic)
      return data || [];
    },
    enabled: !!matterId && !!currentOrganization?.id,
  });

  if (activeView === 'chat') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            Chat con IP-GENIUS
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveView('overview')}>
            ← Volver
          </Button>
        </div>
        <div className="h-[500px]">
          <GeniusChat agentType="legal" matterId={matterId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setActiveView('chat')}
        >
          <Brain className="h-6 w-6 text-amber-600" />
          <span className="text-sm font-medium">Analizar expediente</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => setActiveView('chat')}
        >
          <FileText className="h-6 w-6 text-amber-600" />
          <span className="text-sm font-medium">Generar documento</span>
        </Button>
      </div>

      {/* Recent conversations */}
      {conversations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversaciones ({conversations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversations.map((conv: any) => (
                <div key={conv.id} className="p-2 rounded border text-sm hover:bg-muted/50 cursor-pointer">
                  <p className="font-medium truncate">{conv.title || 'Sin título'}</p>
                  <p className="text-xs text-muted-foreground">{conv.message_count} mensajes</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated documents */}
      {docs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos generados ({docs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {docs.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      v{doc.version} · {new Date(doc.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {conversations.length === 0 && docs.length === 0 && (
        <Card className="p-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-amber-600 mb-2" />
          <p className="text-sm text-muted-foreground">
            Usa IP-GENIUS para analizar este expediente o generar documentos
          </p>
        </Card>
      )}
    </div>
  );
}
