// =============================================
// SECCIÓN: ModulesSettings
// Panel de módulos reorganizado con diseño profesional
// src/pages/app/settings/sections/ModulesSettings.tsx
// =============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  Puzzle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanSummaryCard } from '@/components/modules/PlanSummaryCard';
import { ModulesGrid } from '@/components/modules/ModulesGrid';
import { AddonsSection } from '@/components/modules/AddonsSection';
import { useModulesContext } from '@/contexts/ModulesContext';

type ActiveTab = 'modules' | 'addons';

export default function ModulesSettings() {
  const navigate = useNavigate();
  const { modulesSummary, isLoading } = useModulesContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Módulos y Add-ons</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las funcionalidades activas de tu organización
          </p>
        </div>
      </div>

      {/* Plan Summary Card */}
      <PlanSummaryCard />

      {/* Tabs con contadores */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as ActiveTab)}
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

      {/* Link a página completa */}
      <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/app/settings/modules')}
          className="w-full sm:w-auto"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver página completa de módulos
        </Button>
      </div>
    </div>
  );
}
