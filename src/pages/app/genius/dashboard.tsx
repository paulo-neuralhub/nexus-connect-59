/**
 * Genius Dashboard — Main view with KPIs, proactive suggestions, and tabs
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, MessageSquare, FileText, Zap, Lightbulb, Sparkles, Lock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { NeoBadge } from '@/components/ui/neo-badge';
import { usePageTitle } from '@/contexts/page-context';
import {
  useGeniusTenantConfig,
  useGeniusUsageStats,
  useProactiveSuggestions,
} from '@/hooks/genius/useGeniusTenantConfig';
import { GeniusDisclaimerModal } from '@/components/features/genius/genius-disclaimer-modal';
import { GeniusChatTab } from '@/components/features/genius/genius-chat-tab';
import { GeniusDocumentsTab } from '@/components/features/genius/genius-documents-tab';
import { GeniusActionsTab } from '@/components/features/genius/genius-actions-tab';
import { GeniusHistoryTab } from '@/components/features/genius/genius-history-tab';
import { ModuleGate } from '@/components/common/ModuleGate';

const AMBER = '#F59E0B';

export default function GeniusDashboard() {
  const { setTitle } = usePageTitle();
  const navigate = useNavigate();
  const { data: config, isLoading } = useGeniusTenantConfig();
  const usage = useGeniusUsageStats();
  const { data: proactive = [] } = useProactiveSuggestions();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    setTitle('IP-GENIUS PRO');
  }, [setTitle]);

  // Show disclaimer if not accepted
  useEffect(() => {
    if (!isLoading && config && !config.disclaimer_accepted) {
      setShowDisclaimer(true);
    }
  }, [config, isLoading]);

  const handleDisclaimerAccepted = useCallback(() => {
    setShowDisclaimer(false);
  }, []);

  const handleDisclaimerDecline = useCallback(() => {
    navigate('/app/dashboard');
  }, [navigate]);

  if (isLoading) return null;

  // No config yet — show activation page
  if (!config) {
    return (
      <ModuleGate module="genius">
        <GeniusDisclaimerModal
          open={showDisclaimer}
          onAccepted={handleDisclaimerAccepted}
          onDecline={handleDisclaimerDecline}
        />
        <GeniusActivationPage onActivate={() => setShowDisclaimer(true)} />
      </ModuleGate>
    );
  }

  // Disclaimer not accepted
  if (!config.disclaimer_accepted) {
    return (
      <ModuleGate module="genius">
        <GeniusDisclaimerModal
          open={true}
          onAccepted={handleDisclaimerAccepted}
          onDecline={handleDisclaimerDecline}
        />
      </ModuleGate>
    );
  }

  // Module not active — show presentation
  if (!config.is_active) {
    return (
      <ModuleGate module="genius">
        <GeniusActivationPage onActivate={() => {}} />
      </ModuleGate>
    );
  }

  return (
    <ModuleGate module="genius">
      <div className="space-y-6">
        {/* KPI NeoBadges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Consultas/mes"
            used={usage.queries.used}
            max={usage.queries.max}
            pct={usage.queries.pct}
          />
          <KPICard
            label="Documentos"
            used={usage.documents.used}
            max={usage.documents.max}
            pct={usage.documents.pct}
          />
          <KPICard
            label="Acciones"
            used={usage.actions.used}
            max={usage.actions.max}
            pct={usage.actions.pct}
          />
          <KPICard
            label="Sugerencias"
            used={proactive.length}
            max={0}
            pct={0}
            hideBar
          />
        </div>

        {/* Proactive suggestions */}
        {proactive.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                Sugerencias proactivas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {proactive.slice(0, 3).map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background"
                  >
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-300 text-amber-700"
                    >
                      {s.proposed_action || 'info'}
                    </Badge>
                    <p className="text-sm flex-1 line-clamp-2">{s.content}</p>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="chat" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              <FileText className="h-4 w-4" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-1.5">
              <Zap className="h-4 w-4" /> Acciones
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <GeniusChatTab />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <GeniusDocumentsTab />
          </TabsContent>
          <TabsContent value="actions" className="mt-4">
            <GeniusActionsTab />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <GeniusHistoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </ModuleGate>
  );
}

function KPICard({
  label,
  used,
  max,
  pct,
  hideBar,
}: {
  label: string;
  used: number;
  max: number;
  pct: number;
  hideBar?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <NeoBadge value={used} color={AMBER} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {!hideBar && max > 0 && (
            <>
              <p className="text-xs font-medium">
                {used}/{max}
              </p>
              <Progress value={pct} className="h-1.5 mt-1" />
            </>
          )}
          {hideBar && (
            <p className="text-xs font-medium">{used} pendientes</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function GeniusActivationPage({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">IP-GENIUS PRO</CardTitle>
          <p className="text-muted-foreground">
            Asistente IA especializado en propiedad intelectual
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg border">
              <MessageSquare className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              Chat con RAG legal
            </div>
            <div className="p-3 rounded-lg border">
              <FileText className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              Generación de documentos
            </div>
            <div className="p-3 rounded-lg border">
              <Zap className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              Acciones en la app
            </div>
            <div className="p-3 rounded-lg border">
              <Lightbulb className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              Análisis proactivo
            </div>
          </div>
          <Button
            onClick={onActivate}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <Lock className="h-4 w-4 mr-2" />
            Activar IP-GENIUS
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
