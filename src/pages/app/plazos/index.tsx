// ============================================================
// IP-NEXUS — PLAZOS Y VENCIMIENTOS (v3.2)
// The most critical page: missing a deadline = losing rights forever
// ============================================================

import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageTitle } from '@/hooks/use-page-title';
import { useDeadlines, useDeadlineStats, type MatterDeadline } from '@/hooks/useDeadlines';
import { differenceInDays, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, List, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlazosListTab } from '@/components/plazos/PlazosListTab';
import { PlazosCalendarTab } from '@/components/plazos/PlazosCalendarTab';
import { PlazosRenovacionesTab } from '@/components/plazos/PlazosRenovacionesTab';

export default function PlazosPage() {
  usePageTitle('Plazos y Vencimientos');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'lista';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { deadlines = [], isLoading, markAsCompleted, extendDeadline } = useDeadlines({
    includeCompleted: false,
  });
  const { data: stats } = useDeadlineStats();

  const overdueCount = stats?.overdue ?? 0;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleFilterOverdue = () => {
    setActiveTab('lista');
    setSearchParams({ tab: 'lista', filter: 'overdue' });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      {/* Overdue Alert Banner */}
      {overdueCount > 0 && (
        <button
          onClick={handleFilterOverdue}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
            "bg-destructive/10 border border-destructive/20 hover:bg-destructive/15"
          )}
        >
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <span className="text-sm font-semibold text-destructive">
            ⚠️ {overdueCount} plazo{overdueCount !== 1 ? 's' : ''} vencido{overdueCount !== 1 ? 's' : ''} requieren atención inmediata
          </span>
        </button>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plazos y Vencimientos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona todos los plazos legales de tu portafolio IP
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="lista" className="gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2 hidden md:flex">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="renovaciones" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Renovaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4">
          <PlazosListTab
            deadlines={deadlines}
            isLoading={isLoading}
            onComplete={markAsCompleted}
            onExtend={extendDeadline}
            initialFilter={searchParams.get('filter') || undefined}
          />
        </TabsContent>

        <TabsContent value="calendario" className="mt-4">
          <PlazosCalendarTab />
        </TabsContent>

        <TabsContent value="renovaciones" className="mt-4">
          <PlazosRenovacionesTab
            deadlines={deadlines}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
