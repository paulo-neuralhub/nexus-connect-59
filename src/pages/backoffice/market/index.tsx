/**
 * Backoffice Market — /backoffice/market
 * 5 tabs: Agentes, Solicitudes, Disputas, Recibos, Config
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, AlertTriangle, Receipt, Settings, CheckCircle, XCircle, Clock, Star, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function BackofficeMarketPage() {
  // Agents
  const { data: agents = [] } = useQuery({
    queryKey: ['bo-market-agents'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('market_agents').select('*').order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
  });

  // Requests
  const { data: requests = [] } = useQuery({
    queryKey: ['bo-market-requests'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('market_service_requests').select('*').order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
  });

  // Disputes
  const disputes = requests.filter((r: any) => r.status === 'disputed');

  // Fee receipts
  const { data: receipts = [] } = useQuery({
    queryKey: ['bo-fee-receipts'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('market_official_fee_receipts').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });
  const pendingReceipts = receipts.filter((r: any) => !r.verified);

  // Price regulations
  const { data: regulations = [] } = useQuery({
    queryKey: ['bo-price-regs'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('market_price_regulations').select('*').order('jurisdiction_code');
      return data || [];
    },
  });

  const verifyAgent = async (agentId: string) => {
    await (supabase as any).from('market_agents').update({ is_verified: true, verified_at: new Date().toISOString() }).eq('id', agentId);
    toast.success('Agente marcado como comprobado');
  };

  const toggleFeatured = async (agentId: string, current: boolean) => {
    await (supabase as any).from('market_agents').update({ is_featured: !current }).eq('id', agentId);
    toast.success(current ? 'Agente desmarcado como patrocinado' : 'Agente marcado como patrocinado');
  };

  const verifyReceipt = async (id: string) => {
    await (supabase as any).from('market_official_fee_receipts').update({ verified: true, verified_at: new Date().toISOString() }).eq('id', id);
    toast.success('Recibo verificado');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">IP-MARKET — Gestión</h1>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents"><Users className="w-3.5 h-3.5 mr-1" /> Agentes ({agents.length})</TabsTrigger>
          <TabsTrigger value="requests"><FileText className="w-3.5 h-3.5 mr-1" /> Solicitudes</TabsTrigger>
          <TabsTrigger value="disputes" className="relative">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Disputas
            {disputes.length > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 ml-1">{disputes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <Receipt className="w-3.5 h-3.5 mr-1" /> Recibos
            {pendingReceipts.length > 0 && <Badge className="text-[10px] px-1.5 ml-1" style={{ background: '#F59E0B' }}>{pendingReceipts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="config"><Settings className="w-3.5 h-3.5 mr-1" /> Config</TabsTrigger>
        </TabsList>

        {/* AGENTS TAB */}
        <TabsContent value="agents" className="mt-4 space-y-3">
          {agents.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.display_name}</span>
                    {a.is_verified && <Badge style={{ background: '#10B981', color: '#fff' }} className="text-[10px]">Comprobado</Badge>}
                    {a.is_featured && <Badge style={{ background: '#FCA311', color: '#fff' }} className="text-[10px]">Patrocinado</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{a.firm_name} · {a.country_code} · Plan: {a.market_plan}</p>
                  <p className="text-[10px] text-gray-400">Rating: {a.rating_avg} · Servicios: {a.completed_services}</p>
                </div>
                <div className="flex gap-2">
                  {!a.is_verified && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => verifyAgent(a.id)}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Marcar comprobado
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => toggleFeatured(a.id, a.is_featured)}>
                    <Star className="w-3 h-3 mr-1" /> {a.is_featured ? 'Quitar' : 'Patrocinado'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {agents.length === 0 && <Empty text="No hay agentes registrados" />}
        </TabsContent>

        {/* REQUESTS TAB */}
        <TabsContent value="requests" className="mt-4 space-y-3">
          {requests.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">{r.title}</span>
                    <Badge className="ml-2 text-[10px]" variant="secondary">{r.status}</Badge>
                    <p className="text-xs text-gray-500">{r.service_type} · {r.jurisdiction_code} · €{r.total_amount_eur || 0}</p>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {r.created_at && format(new Date(r.created_at), 'dd/MM/yy', { locale: es })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {requests.length === 0 && <Empty text="No hay solicitudes" />}
        </TabsContent>

        {/* DISPUTES TAB */}
        <TabsContent value="disputes" className="mt-4 space-y-3">
          {disputes.length === 0 ? <Empty text="No hay disputas activas 🎉" /> : disputes.map((d: any) => {
            const sla = d.resolution_center_response_deadline ? new Date(d.resolution_center_response_deadline) : null;
            const daysLeft = sla ? Math.max(0, Math.ceil((sla.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
            return (
              <Card key={d.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm">{d.title}</span>
                      <Badge variant="destructive" className="ml-2 text-[10px]">Disputa</Badge>
                    </div>
                    {daysLeft !== null && (
                      <Badge style={{ background: daysLeft <= 1 ? '#EF4444' : '#F59E0B', color: '#fff' }} className="text-[10px]">
                        <Clock className="w-3 h-3 mr-1" /> {daysLeft}d restantes SLA
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Iniciado por: {d.resolution_center_initiated_by} · €{d.total_amount_eur || 0} en disputa
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" style={{ background: '#10B981' }} className="text-white text-xs">Liberar al agente</Button>
                    <Button size="sm" variant="outline" className="text-xs text-red-600">Reembolsar al cliente</Button>
                    <Button size="sm" variant="ghost" className="text-xs">Split</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* RECEIPTS TAB */}
        <TabsContent value="receipts" className="mt-4 space-y-3">
          {receipts.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm">{r.office_code} — €{r.amount_paid}</span>
                  {r.verified ? (
                    <Badge className="ml-2 text-[10px]" style={{ background: '#10B981', color: '#fff' }}>Verificado</Badge>
                  ) : (
                    <Badge className="ml-2 text-[10px]" style={{ background: '#F59E0B', color: '#fff' }}>Pendiente</Badge>
                  )}
                  <p className="text-xs text-gray-500">Ref: {r.receipt_reference} · Pagado: {r.paid_at}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-xs"><Eye className="w-3 h-3 mr-1" /> Ver</Button>
                  {!r.verified && (
                    <>
                      <Button size="sm" className="text-xs text-white" style={{ background: '#10B981' }} onClick={() => verifyReceipt(r.id)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Verificar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs text-red-500"><XCircle className="w-3 h-3 mr-1" /> Rechazar</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {receipts.length === 0 && <Empty text="No hay recibos de tasas oficiales" />}
        </TabsContent>

        {/* CONFIG TAB */}
        <TabsContent value="config" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Regulación de Precios por Jurisdicción</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="py-2 pr-4">Código</th>
                      <th className="py-2 pr-4">Jurisdicción</th>
                      <th className="py-2 pr-4">Tipo regulación</th>
                      <th className="py-2 pr-4">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regulations.map((reg: any) => (
                      <tr key={reg.id} className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">{reg.jurisdiction_code}</td>
                        <td className="py-2 pr-4">{reg.jurisdiction_name}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary" className="text-[10px]">
                            {reg.price_regulation_type === 'free' && '🟢 Libre'}
                            {reg.price_regulation_type === 'reference_only' && '🔵 Referencia'}
                            {reg.price_regulation_type === 'mandatory_estimate' && '🟡 Obligatoria'}
                            {reg.price_regulation_type === 'restricted' && '🔴 Restringida'}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-xs text-gray-500 max-w-xs truncate">{reg.price_display_note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Comisiones por Plan</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { plan: 'Free', rate: '12%', color: '#6B7280' },
                  { plan: 'Verified', rate: '10%', color: '#10B981' },
                  { plan: 'Pro', rate: '8%', color: '#3B82F6' },
                  { plan: 'Premium', rate: '6%', color: '#8B5CF6' },
                ].map(p => (
                  <div key={p.plan} className="p-4 rounded-lg border text-center">
                    <p className="font-bold text-lg" style={{ color: p.color }}>{p.rate}</p>
                    <p className="text-xs text-gray-500">{p.plan}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Configuración General</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Auto-release (días)</p>
                <Input type="number" defaultValue={7} className="w-24" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">SLA disputas (días hábiles)</p>
                <Input type="number" defaultValue={5} className="w-24" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card><CardContent className="p-12 text-center text-gray-400 text-sm">{text}</CardContent></Card>
  );
}
