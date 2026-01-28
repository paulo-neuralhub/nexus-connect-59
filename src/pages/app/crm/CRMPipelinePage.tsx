/**
 * CRM Pipeline Page - Kanban con selector Leads/Negociaciones
 */

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/contexts/page-context';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLeads, useUpdateLeadStatus, useApproveLead, Lead, LeadStatus } from '@/hooks/crm/useLeads';
import { useDeals, useUpdateDealStage, useWinDeal, useLoseDeal, Deal, DealStage } from '@/hooks/crm/useDeals';
import { PipelineKanbanColumn } from '@/components/features/crm/pipeline/PipelineKanbanColumn';
import { PipelineCard } from '@/components/features/crm/pipeline/PipelineCard';
import { LeadDetailModal } from '@/components/crm/modals/LeadDetailModal';
import { DealDetailSheet } from '@/components/crm/modals/DealDetailSheet';
import { Plus, Search, Filter, RefreshCw, Target, Briefcase, Info } from 'lucide-react';
import { toast } from 'sonner';

type ViewType = 'leads' | 'deals';

// Columnas para Leads
const LEAD_COLUMNS = [
  { id: 'new', title: '🆕 Nuevo', color: '#3B82F6', status: 'new' as LeadStatus },
  { id: 'contacted', title: '📞 Contactar', color: '#8B5CF6', status: 'contacted' as LeadStatus },
  { id: 'standby', title: '🔄 Rellamar', color: '#F59E0B', status: 'standby' as LeadStatus },
  { id: 'qualified', title: '✅ Cualificado', color: '#22C55E', status: 'qualified' as LeadStatus },
  { id: 'discard', title: '❌ Descartado', color: '#EF4444', status: 'discard' as LeadStatus },
];

// Columnas para Negociaciones
const DEAL_COLUMNS = [
  { id: 'contacted', title: '🆕 Nueva', color: '#3B82F6', stage: 'contacted' as DealStage },
  { id: 'qualified', title: '📅 Reunión', color: '#8B5CF6', stage: 'qualified' as DealStage },
  { id: 'proposal', title: '📄 Propuesta', color: '#F59E0B', stage: 'proposal' as DealStage },
  { id: 'negotiation', title: '🤝 Negociación', color: '#EC4899', stage: 'negotiation' as DealStage },
  { id: 'won', title: '✅ Ganado', color: '#22C55E', stage: 'won' as DealStage, isWon: true },
  { id: 'lost', title: '❌ Perdido', color: '#EF4444', stage: 'lost' as DealStage, isLost: true },
];

export default function CRMPipelinePage() {
  usePageTitle('Pipeline');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as ViewType) || 'leads';
  
  const [view, setView] = useState<ViewType>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Detail modals
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Data
  const { data: leads = [], isLoading: isLoadingLeads, refetch: refetchLeads } = useLeads();
  const { data: deals = [], isLoading: isLoadingDeals, refetch: refetchDeals } = useDeals();

  // Mutations
  const updateLeadStatus = useUpdateLeadStatus();
  const approveLead = useApproveLead();
  const updateDealStage = useUpdateDealStage();
  const winDeal = useWinDeal();
  const loseDeal = useLoseDeal();

  // Sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter items by search
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l => 
      l.contact_name?.toLowerCase().includes(q) ||
      l.company_name?.toLowerCase().includes(q) ||
      l.contact_email?.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals;
    const q = searchQuery.toLowerCase();
    return deals.filter(d => 
      d.name?.toLowerCase().includes(q) ||
      d.client?.name?.toLowerCase().includes(q)
    );
  }, [deals, searchQuery]);

  // Group items by column
  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    LEAD_COLUMNS.forEach(col => { grouped[col.id] = []; });
    
    filteredLeads.forEach(lead => {
      const status = lead.status || 'new';
      // Map status to column id - skip converted leads
      if (status === 'converted') return;
      if (status === 'new') grouped['new']?.push(lead);
      else if (status === 'contacted') grouped['contacted']?.push(lead);
      else if (status === 'standby') grouped['standby']?.push(lead);
      else grouped['discard']?.push(lead);
    });
    
    return grouped;
  }, [filteredLeads]);

  const dealsByColumn = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    DEAL_COLUMNS.forEach(col => { grouped[col.id] = []; });
    
    filteredDeals.forEach(deal => {
      const stage = deal.stage || 'contacted';
      if (grouped[stage]) grouped[stage].push(deal);
    });
    
    return grouped;
  }, [filteredDeals]);

  // Handle view change
  const handleViewChange = (newView: string) => {
    setView(newView as ViewType);
    setSearchParams({ view: newView });
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const itemId = active.id as string;
    const targetColId = over.id as string;

    if (view === 'leads') {
      const lead = leads.find(l => l.id === itemId);
      if (!lead) return;

      const targetCol = LEAD_COLUMNS.find(c => c.id === targetColId);
      if (!targetCol) return;

      // Check if converting to deal
      if (targetColId === 'qualified') {
        approveLead.mutate(
          { leadId: lead.id, dealTitle: `Oportunidad de ${lead.company_name || lead.contact_name}` },
          { onSuccess: () => toast.success('Lead convertido a negociación') }
        );
        return;
      }

      if (lead.status !== targetCol.status) {
        updateLeadStatus.mutate(
          { leadId: lead.id, status: targetCol.status },
          { onSuccess: () => toast.success(`Movido a ${targetCol.title}`) }
        );
      }
    } else {
      const deal = deals.find(d => d.id === itemId);
      if (!deal) return;

      const targetCol = DEAL_COLUMNS.find(c => c.id === targetColId);
      if (!targetCol || !targetCol.stage) return;

      if (targetCol.isWon) {
        winDeal.mutate({ dealId: deal.id }, { onSuccess: () => toast.success('🎉 ¡Deal ganado!') });
        return;
      }

      if (targetCol.isLost) {
        loseDeal.mutate(
          { dealId: deal.id, reason: 'Perdido' },
          { onSuccess: () => toast.info('Deal marcado como perdido') }
        );
        return;
      }

      if (deal.stage !== targetCol.stage) {
        updateDealStage.mutate(
          { dealId: deal.id, stage: targetCol.stage },
          { onSuccess: () => toast.success(`Movido a ${targetCol.title}`) }
        );
      }
    }
  };

  const handleRefresh = useCallback(() => {
    refetchLeads();
    refetchDeals();
    toast.success('Datos actualizados');
  }, [refetchLeads, refetchDeals]);

  const isLoading = view === 'leads' ? isLoadingLeads : isLoadingDeals;
  const columns = view === 'leads' ? LEAD_COLUMNS : DEAL_COLUMNS;
  const itemsByColumn = view === 'leads' ? leadsByColumn : dealsByColumn;

  // Active item for overlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    if (view === 'leads') return leads.find(l => l.id === activeId);
    return deals.find(d => d.id === activeId);
  }, [activeId, view, leads, deals]);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* View selector */}
          <Tabs value={view} onValueChange={handleViewChange}>
            <TabsList className="grid w-[280px] grid-cols-2">
              <TabsTrigger value="leads" className="gap-2">
                <Target className="w-4 h-4" />
                Leads
              </TabsTrigger>
              <TabsTrigger value="deals" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Negociaciones
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem>Todos</DropdownMenuItem>
              <DropdownMenuItem>Alta prioridad</DropdownMenuItem>
              <DropdownMenuItem>Esta semana</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* New */}
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo {view === 'leads' ? 'Lead' : 'Deal'}
          </Button>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Info className="w-4 h-4" />
        {view === 'leads' 
          ? 'Arrastra a "Cualificado" para convertir en Negociación'
          : 'Al mover a "Ganado" se abrirá el wizard para crear expediente(s)'
        }
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {columns.map(col => (
            <Skeleton key={col.id} className="w-[280px] h-[400px] flex-shrink-0" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {columns.map(col => {
              const items = (itemsByColumn[col.id] || []) as (Lead | Deal)[];
              const totalValue = items.reduce((sum, item) => {
                const val = view === 'leads' ? (item as Lead).estimated_value : (item as Deal).amount;
                return sum + (val || 0);
              }, 0);

              return (
                <PipelineKanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  count={items.length}
                  totalValue={totalValue}
                  isWon={'isWon' in col && col.isWon}
                  isLost={'isLost' in col && col.isLost}
                >
                  {items.map(item => (
                    <PipelineCard
                      key={item.id}
                      item={item}
                      type={view}
                      onClick={() => {
                        if (view === 'leads') setSelectedLead(item as Lead);
                        else setSelectedDeal(item as Deal);
                      }}
                    />
                  ))}
                </PipelineKanbanColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeItem && (
              <PipelineCard
                item={activeItem}
                type={view}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Detail Modals */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
        />
      )}

      {selectedDeal && (
        <DealDetailSheet
          deal={selectedDeal}
          open={!!selectedDeal}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
        />
      )}
    </div>
  );
}
