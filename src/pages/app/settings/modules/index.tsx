// =============================================
// PÁGINA: ModulesManagementPage
// Gestión de módulos y add-ons - Diseño profesional reorganizado
// src/pages/app/settings/modules/index.tsx
// =============================================

import { useState } from 'react';
import { 
  Search,
  Package,
  Puzzle,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PlanSummaryCard } from '@/components/modules/PlanSummaryCard';
import { ModulesGrid } from '@/components/modules/ModulesGrid';
import { AddonsSection } from '@/components/modules/AddonsSection';
import { PageContainer } from '@/components/layout/PageContainer';
import { useModulesContext } from '@/contexts/ModulesContext';

export default function ModulesManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'modules' | 'addons'>('modules');
  const { modulesSummary } = useModulesContext();

  return (
    <TooltipProvider>
      <PageContainer className="py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Módulos y Add-ons
              </h1>
              <p className="text-muted-foreground">
                Gestiona las funcionalidades activas de tu organización
              </p>
            </div>
          </div>

          {/* Plan Summary */}
          <PlanSummaryCard />

          {/* Tabs con contadores */}
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as 'modules' | 'addons')}
            className="space-y-6"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap border-b pb-4">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="modules" className="gap-2 px-4">
                  <Package className="h-4 w-4" />
                  Módulos
                  {modulesSummary.total_active > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {modulesSummary.total_active}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="addons" className="gap-2 px-4">
                  <Puzzle className="h-4 w-4" />
                  Add-ons
                  {modulesSummary.total_addons > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {modulesSummary.total_addons}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Búsqueda */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === 'modules' ? 'Buscar módulos...' : 'Buscar add-ons...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>

            {/* Tab: Módulos */}
            <TabsContent value="modules" className="mt-0 space-y-1">
              <ModulesGrid searchQuery={searchQuery} />
            </TabsContent>

            {/* Tab: Add-ons */}
            <TabsContent value="addons" className="mt-0 space-y-1">
              <AddonsSection searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </TooltipProvider>
  );
}
