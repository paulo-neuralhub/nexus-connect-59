// ============================================================
// IP-NEXUS BACKOFFICE — Knowledge Map Page
// ============================================================

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NeoBadge } from '@/components/ui/neo-badge';
import {
  useKnowledgeCoverageStats,
  useKnowledgePendingReviews,
  useKnowledgeOutdatedCount,
} from '@/hooks/backoffice/useKnowledgeMap';
import { KnowledgeCoverageTab } from '@/components/backoffice/knowledge/KnowledgeCoverageTab';
import { KnowledgeUpdatesTab } from '@/components/backoffice/knowledge/KnowledgeUpdatesTab';
import { Globe, Map, RefreshCw, Plug, Settings } from 'lucide-react';

export default function KnowledgeMapPage() {
  const { data: stats } = useKnowledgeCoverageStats();
  const { data: pendingReviews } = useKnowledgePendingReviews();
  const { data: outdatedCount } = useKnowledgeOutdatedCount();
  const [tab, setTab] = useState('coverage');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe className="h-6 w-6 text-[#F59E0B]" />
          Mapa Mundial de Conocimiento
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cobertura de la base de conocimiento legal del IP-GENIUS por jurisdicción
        </p>
      </div>

      {/* NeoBadges */}
      <div className="flex flex-wrap gap-4">
        <NeoBadge value={stats?.complete ?? 0} label="Completo" color="#22C55E" size="lg" />
        <NeoBadge value={stats?.partial ?? 0} label="Parcial" color="#EAB308" size="lg" />
        <NeoBadge value={stats?.minimal ?? 0} label="Mínimo" color="#EF4444" size="lg" />
        <NeoBadge value={stats?.none ?? 0} label="Sin cob." color="#64748B" size="lg" />
        {(pendingReviews ?? 0) > 0 && (
          <NeoBadge value={pendingReviews!} label="Revisión" color="#EF4444" size="lg" active />
        )}
        {(outdatedCount ?? 0) > 0 && (
          <NeoBadge value={outdatedCount!} label="Obsoletos" color="#F59E0B" size="lg" />
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="coverage" className="gap-1.5">
            <Map className="h-3.5 w-3.5" /> Cobertura Genius
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Automatización
          </TabsTrigger>
          <TabsTrigger value="apis" className="gap-1.5">
            <Plug className="h-3.5 w-3.5" /> APIs
          </TabsTrigger>
          <TabsTrigger value="updates" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Actualizaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coverage">
          <KnowledgeCoverageTab />
        </TabsContent>

        <TabsContent value="automation">
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
            <Settings className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Automatización de Oficinas IP</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Panel de capacidades de automatización con las 15 fases del ciclo de vida de PI — próximamente integrado con ipo_automation_capabilities.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="apis">
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
            <Plug className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Catálogo de APIs de Oficinas IP</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Catálogo de APIs de oficinas IP — próximamente.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="updates">
          <KnowledgeUpdatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
