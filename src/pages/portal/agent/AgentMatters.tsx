/**
 * Agent Matters — /portal/:slug/agent/matters
 * Vista de expedientes con agrupación por familia y filtros
 */
import { useState, useMemo } from 'react';
import { useAgentPortalContext } from './AgentPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, FolderOpen, Map, Send, BarChart3, CheckCircle, Clock, XCircle, FileText, ArrowRight } from 'lucide-react';
import type { AgentMatter } from '@/hooks/useAgentPortal';

// Use mock matters
const ALL_MOCK_MATTERS: AgentMatter[] = [
  { id: 'm1', title: 'NEXUS', status: 'registered', type: 'trademark', jurisdiction: 'EUIPO', reference: 'NX-2024-001', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: '2026-03-01', owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm2', title: 'NEXUS', status: 'examination', type: 'trademark', jurisdiction: 'USPTO', reference: 'NX-2024-002', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: '2026-02-15', owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm3', title: 'NEXUS', status: 'registered', type: 'trademark', jurisdiction: 'OEPM', reference: 'NX-2024-003', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: '2026-01-10', owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm4', title: 'NEXUS', status: 'filed', type: 'trademark', jurisdiction: 'JPO', reference: 'NX-2025-004', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: '2026-03-10', owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm5', title: 'NEXUS', status: 'abandoned', type: 'trademark', jurisdiction: 'CNIPA', reference: 'NX-2021-005', family_name: 'Familia NEXUS', family_id: 'fam-1', updated_at: '2021-06-01', owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm6', title: 'ALPHA', status: 'filed', type: 'trademark', jurisdiction: 'EUIPO', reference: 'AL-2025-001', family_name: null, family_id: null, updated_at: '2026-03-15', owner_account_id: 'client-1', intermediate_agent_id: 'agent-1' },
  { id: 'm7', title: 'BETA', status: 'registered', type: 'trademark', jurisdiction: 'EUIPO', reference: 'BT-2024-001', family_name: null, family_id: null, updated_at: '2025-11-20', owner_account_id: 'client-2', intermediate_agent_id: 'agent-1' },
  { id: 'm8', title: 'GAMMA', status: 'registered', type: 'trademark', jurisdiction: 'OEPM', reference: 'GM-2024-001', family_name: null, family_id: null, updated_at: '2025-10-05', owner_account_id: 'client-2', intermediate_agent_id: 'agent-1' },
];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string }> = {
  registered: { icon: CheckCircle, label: 'Registrada', color: 'text-emerald-600' },
  examination: { icon: Clock, label: 'En examen', color: 'text-amber-600' },
  filed: { icon: FileText, label: 'Presentada', color: 'text-blue-600' },
  abandoned: { icon: XCircle, label: 'Abandonada', color: 'text-red-500' },
};

export default function AgentMattersPage() {
  const { clients, activeClient } = useAgentPortalContext();
  const [clientFilter, setClientFilter] = useState<string>(activeClient?.client_account_id || 'all');
  const [viewMode, setViewMode] = useState<'list' | 'family' | 'map'>('family');

  const filteredMatters = useMemo(() => {
    let matters = ALL_MOCK_MATTERS;
    if (clientFilter !== 'all') {
      matters = matters.filter(m => m.owner_account_id === clientFilter);
    }
    return matters;
  }, [clientFilter]);

  const familyGroups = useMemo(() => {
    const groups: Record<string, AgentMatter[]> = {};
    const standalone: AgentMatter[] = [];
    filteredMatters.forEach(m => {
      if (m.family_id && m.family_name) {
        if (!groups[m.family_id]) groups[m.family_id] = [];
        groups[m.family_id].push(m);
      } else {
        standalone.push(m);
      }
    });
    return { groups, standalone };
  }, [filteredMatters]);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Expedientes</h1>
        <div className="flex items-center gap-3">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.client_account_id} value={c.client_account_id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="family" className="gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> Por familia</TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Por expediente</TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5"><Map className="w-3.5 h-3.5" /> Por mapa</TabsTrigger>
        </TabsList>

        {/* Family view */}
        <TabsContent value="family" className="space-y-4 mt-4">
          {Object.entries(familyGroups.groups).map(([familyId, matters]) => {
            const familyName = matters[0]?.family_name || 'Sin nombre';
            const clientName = clients.find(c => c.client_account_id === matters[0]?.owner_account_id)?.name;
            return (
              <Card key={familyId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      📁 {familyName}
                      {clientName && <span className="text-muted-foreground font-normal">· {clientName}</span>}
                      <Badge variant="secondary" className="text-[10px]">{matters.length} países</Badge>
                    </CardTitle>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1"><BarChart3 className="w-3 h-3" /> Report</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1"><Send className="w-3 h-3" /> Instrucción</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {matters.map(m => {
                      const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.filed;
                      const Icon = cfg.icon;
                      return (
                        <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{m.title}</span>
                            <span className="text-muted-foreground">— {m.jurisdiction}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                              <Icon className="w-3.5 h-3.5" /> {cfg.label}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">{m.reference}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {familyGroups.standalone.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Expedientes individuales</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {familyGroups.standalone.map(m => {
                    const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.filed;
                    const Icon = cfg.icon;
                    const clientName = clients.find(c => c.client_account_id === m.owner_account_id)?.name;
                    return (
                      <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{m.title}</span>
                          <span className="text-muted-foreground">— {m.jurisdiction}</span>
                          {clientName && <span className="text-xs text-muted-foreground">({clientName})</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                            <Icon className="w-3.5 h-3.5" /> {cfg.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* List view */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="divide-y">
                {filteredMatters.map(m => {
                  const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.filed;
                  const Icon = cfg.icon;
                  const clientName = clients.find(c => c.client_account_id === m.owner_account_id)?.name;
                  return (
                    <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{m.title}</span>
                        <span className="text-muted-foreground">— {m.jurisdiction}</span>
                        {clientName && <Badge variant="outline" className="text-[10px]">{clientName}</Badge>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" /> {cfg.label}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{m.reference}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map view */}
        <TabsContent value="map" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Map className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Vista de mapa</p>
                <p className="text-sm">Próximamente: mapa interactivo de cobertura por jurisdicción</p>
                <div className="flex gap-4 justify-center mt-6">
                  {['EUIPO', 'USPTO', 'OEPM', 'JPO', 'CNIPA'].map(j => {
                    const mattersInJ = filteredMatters.filter(m => m.jurisdiction === j);
                    const hasRegistered = mattersInJ.some(m => m.status === 'registered');
                    const hasActive = mattersInJ.some(m => !['registered', 'abandoned'].includes(m.status));
                    const color = hasRegistered ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : hasActive ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : mattersInJ.length === 0 ? 'bg-muted text-muted-foreground'
                      : 'bg-red-100 text-red-700 border-red-200';
                    return (
                      <div key={j} className={`px-3 py-2 rounded-lg border text-sm font-medium ${color}`}>
                        {j} ({mattersInJ.length})
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
