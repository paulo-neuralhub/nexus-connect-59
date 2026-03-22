/**
 * Agent Dashboard — /portal/:slug/agent/dashboard
 */
import { useNavigate, useParams } from 'react-router-dom';
import { useAgentPortalContext } from './AgentPortalLayout';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, MessageSquare, AlertTriangle, Briefcase, Clock, Receipt, Users, Send, BarChart3, ShoppingBag } from 'lucide-react';

// Mock instructions
const MOCK_INSTRUCTIONS = [
  { id: 'i1', title: 'Renovar marca NEXUS en EUIPO', client: 'Startup XYZ', deadline: '15/05/2026', urgent: true, status: 'received', time: 'hace 2 horas' },
  { id: 'i2', title: 'Responder OA USPTO ALPHA', client: 'TechCorp', deadline: '20/05/2026', urgent: false, status: 'received', time: 'hace 5 horas' },
  { id: 'i3', title: 'Confirmar registro BETA OEPM', client: 'Startup XYZ', deadline: '01/06/2026', urgent: false, status: 'received', time: 'ayer' },
];

export default function AgentDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { agent, clients, activeClient, setActiveClient, globalKpis } = useAgentPortalContext();

  // "All clients" mode
  if (!activeClient) {
    return (
      <div className="p-6 space-y-6 max-w-6xl">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard del Agente</h1>
          <p className="text-sm text-muted-foreground">Vista global de tu cartera de clientes</p>
        </div>

        {/* KPI Badges */}
        <div className="flex gap-4 flex-wrap">
          <NeoBadge value={globalKpis.total_active_matters} label="Activos" color="#3B82F6" size="lg" />
          <NeoBadge value={globalKpis.total_deadlines_30d} label="30 días" color={globalKpis.total_deadlines_30d > 0 ? '#EF4444' : '#10B981'} size="lg" />
          <NeoBadge value={globalKpis.pending_instructions} label="Instruc." color="#F59E0B" size="lg" />
          <NeoBadge value={`€${globalKpis.total_pending_invoices.toLocaleString()}`} label="Pend." color="#8B5CF6" size="lg" />
          <NeoBadge value={globalKpis.total_clients} label="Clientes" color="#06B6D4" size="lg" />
        </div>

        {/* Pending Instructions */}
        <Card className={MOCK_INSTRUCTIONS.some(i => i.urgent) ? 'border-amber-200 bg-amber-50/50' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              📥 INSTRUCCIONES PENDIENTES ({MOCK_INSTRUCTIONS.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_INSTRUCTIONS.map(inst => (
              <div key={inst.id} className="flex items-start justify-between p-3 rounded-lg bg-background border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {inst.urgent ? (
                      <Badge variant="destructive" className="text-[10px]">🔴 URGENTE</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">🟡 NORMAL</Badge>
                    )}
                    <span className="text-sm font-medium">{inst.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cliente: {inst.client} · Vence: {inst.deadline}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="default" className="h-7 text-xs gap-1">
                    <Check className="w-3 h-3" /> Confirmar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <MessageSquare className="w-3 h-3" /> Consultar
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="link" className="text-xs px-0" onClick={() => navigate(`/portal/${slug}/agent/inbox`)}>
              Ver todas las instrucciones →
            </Button>
          </CardContent>
        </Card>

        {/* Client List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Cartera de clientes</h2>
          {clients.map(client => (
            <Card
              key={client.id}
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => {
                setActiveClient(client);
                navigate(`/portal/${slug}/agent/matters`);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{client.name}</span>
                      {client.overdue_deadlines > 0 && (
                        <Badge variant="destructive" className="text-[10px]">🔴 {client.overdue_deadlines} urgentes</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {client.total_matters} expedientes · {client.active_matters} activos · {client.deadlines_next_30d} vencen pronto
                    </div>
                    {client.pending_invoices_eur > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Factura pendiente: €{client.pending_invoices_eur.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // "Selected client" mode
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setActiveClient(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Todos los clientes
        </Button>
        <h1 className="text-xl font-bold">{activeClient.name}</h1>
        {activeClient.overdue_deadlines > 0 && (
          <Badge variant="destructive">{activeClient.overdue_deadlines} urgentes</Badge>
        )}
      </div>

      {/* Quick stats */}
      <div className="flex gap-4 flex-wrap">
        <NeoBadge value={activeClient.total_matters} label="Total" color="#3B82F6" />
        <NeoBadge value={activeClient.active_matters} label="Activos" color="#10B981" />
        <NeoBadge value={activeClient.deadlines_next_30d} label="30 días" color="#F59E0B" />
        <NeoBadge value={`€${activeClient.pending_invoices_eur}`} label="Pend." color="#8B5CF6" />
      </div>

      {/* Agent tools */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Send className="w-3.5 h-3.5" /> Enviar instrucción al despacho
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" /> Watch Report
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/portal/${slug}/agent/storefront`)}>
          <ShoppingBag className="w-3.5 h-3.5" /> Solicitar servicio
        </Button>
      </div>

      {/* Matters preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Expedientes recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Selecciona "Expedientes" en el menú para ver la cartera completa de {activeClient.name}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
