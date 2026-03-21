/**
 * Agent Requests — /agent/requests
 * Inbox with tabs: New, In Progress, Completed, Disputes
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Inbox, Clock, CheckCircle, AlertTriangle, Send, Upload, FileText } from 'lucide-react';
import { useMyAgentProfile, useAgentServiceRequests } from '@/hooks/market/useMarketAgentsV3';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published: { label: 'Nueva', color: '#3B82F6' },
  quoted: { label: 'Presupuesto enviado', color: '#8B5CF6' },
  accepted: { label: 'Aceptada', color: '#10B981' },
  in_progress: { label: 'En curso', color: '#F59E0B' },
  delivered: { label: 'Entregada', color: '#06B6D4' },
  completed: { label: 'Completada', color: '#10B981' },
  disputed: { label: 'Disputa', color: '#EF4444' },
  cancelled: { label: 'Cancelada', color: '#6B7280' },
};

export default function AgentRequests() {
  const { data: agent } = useMyAgentProfile();
  const { data: allRequests = [] } = useAgentServiceRequests(agent?.id);
  const [quoteDialog, setQuoteDialog] = useState<any>(null);
  const [quoteForm, setQuoteForm] = useState({ plan: 'two_phase', phase1: '', phase2: '', revisions: '2', months: '', notes: '' });

  const newReqs = allRequests.filter((r: any) => ['published'].includes(r.status));
  const inProgress = allRequests.filter((r: any) => ['quoted', 'accepted', 'in_progress', 'delivered'].includes(r.status));
  const completed = allRequests.filter((r: any) => ['completed'].includes(r.status));
  const disputes = allRequests.filter((r: any) => ['disputed'].includes(r.status));

  const sendQuote = async () => {
    if (!quoteDialog) return;
    try {
      const total = (parseFloat(quoteForm.phase1) || 0) + (parseFloat(quoteForm.phase2) || 0);
      await (supabase as any).from('market_service_requests').update({
        status: 'quoted',
        status_changed_at: new Date().toISOString(),
        payment_plan: quoteForm.plan,
        official_fees_total_eur: parseFloat(quoteForm.phase1) || 0,
        professional_fees_total_eur: parseFloat(quoteForm.phase2) || 0,
        total_amount_eur: total,
        quote_amount_eur: total,
        quote_notes: quoteForm.notes,
        quote_sent_at: new Date().toISOString(),
        revisions_included: parseInt(quoteForm.revisions) || 2,
        estimated_days: (parseInt(quoteForm.months) || 6) * 30,
        updated_at: new Date().toISOString(),
      }).eq('id', quoteDialog.id);
      toast.success('Presupuesto enviado');
      setQuoteDialog(null);
    } catch { toast.error('Error al enviar presupuesto'); }
  };

  const markDelivered = async (req: any) => {
    const files = req.delivery_files || [];
    if (files.length === 0) {
      toast.error('Debes subir evidencia antes de marcar como completado');
      return;
    }
    await (supabase as any).from('market_service_requests').update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      auto_release_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', req.id);
    toast.success('Servicio marcado como entregado');
  };

  const renderRequest = (req: any, showQuoteBtn = false) => {
    const st = STATUS_MAP[req.status] || { label: req.status, color: '#6B7280' };
    return (
      <Card key={req.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{req.title}</h3>
                <Badge style={{ background: st.color, color: '#fff' }} className="text-[10px]">{st.label}</Badge>
              </div>
              <p className="text-xs text-gray-500">{req.service_type} · {req.jurisdiction_code} · {req.urgency}</p>
              {req.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{req.description}</p>}
              <p className="text-[10px] text-gray-400 mt-1">
                {req.created_at && format(new Date(req.created_at), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
            <div className="flex gap-2">
              {showQuoteBtn && req.status === 'published' && (
                <Dialog open={quoteDialog?.id === req.id} onOpenChange={open => setQuoteDialog(open ? req : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" style={{ background: '#10B981' }} className="text-white text-xs">
                      <Send className="w-3 h-3 mr-1" /> Presupuesto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Enviar presupuesto</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Plan de pago</Label>
                        <Select value={quoteForm.plan} onValueChange={v => setQuoteForm(f => ({ ...f, plan: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Pago único</SelectItem>
                            <SelectItem value="two_phase">Dos fases</SelectItem>
                            <SelectItem value="milestone">Hitos</SelectItem>
                            <SelectItem value="subscription">Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {quoteForm.plan === 'two_phase' && (
                        <>
                          <div>
                            <Label className="text-xs">Fase 1 — Tasas oficiales (€)</Label>
                            <Input type="number" value={quoteForm.phase1} onChange={e => setQuoteForm(f => ({ ...f, phase1: e.target.value }))} />
                            <p className="text-[10px] text-amber-600 mt-1">⚠️ No reembolsables una vez pagadas a la oficina</p>
                          </div>
                          <div>
                            <Label className="text-xs">Fase 2 — Honorarios (€)</Label>
                            <Input type="number" value={quoteForm.phase2} onChange={e => setQuoteForm(f => ({ ...f, phase2: e.target.value }))} />
                          </div>
                        </>
                      )}
                      {quoteForm.plan === 'single' && (
                        <div>
                          <Label className="text-xs">Importe total (€)</Label>
                          <Input type="number" value={quoteForm.phase2} onChange={e => setQuoteForm(f => ({ ...f, phase2: e.target.value, phase1: '0' }))} />
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Revisiones incluidas</Label>
                        <Select value={quoteForm.revisions} onValueChange={v => setQuoteForm(f => ({ ...f, revisions: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tiempo estimado (meses)</Label>
                        <Input type="number" value={quoteForm.months} onChange={e => setQuoteForm(f => ({ ...f, months: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Notas</Label>
                        <Textarea value={quoteForm.notes} onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                      </div>
                      <Button onClick={sendQuote} className="w-full text-white" style={{ background: '#10B981' }}>Enviar presupuesto</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {['in_progress', 'accepted'].includes(req.status) && (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => markDelivered(req)}
                  disabled={(req.delivery_files || []).length === 0}>
                  <Upload className="w-3 h-3 mr-1" /> Marcar completado
                </Button>
              )}
            </div>
          </div>
          {/* Evidence block for in_progress */}
          {['in_progress', 'accepted'].includes(req.status) && (req.delivery_files || []).length === 0 && (
            <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Sin evidencia adjunta. Sube archivos para poder marcar como completado y activar el pago automático.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Solicitudes</h1>
      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new" className="gap-1.5">
            <Inbox className="w-3.5 h-3.5" /> Nuevas {newReqs.length > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 ml-1">{newReqs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="progress"><Clock className="w-3.5 h-3.5 mr-1" /> En curso</TabsTrigger>
          <TabsTrigger value="completed"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Completadas</TabsTrigger>
          <TabsTrigger value="disputes"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Disputas</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-4">
          {newReqs.length === 0 ? <EmptyState text="No hay solicitudes nuevas" /> : newReqs.map(r => renderRequest(r, true))}
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          {inProgress.length === 0 ? <EmptyState text="No hay servicios en curso" /> : inProgress.map(r => renderRequest(r))}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {completed.length === 0 ? <EmptyState text="No hay servicios completados" /> : completed.map(r => renderRequest(r))}
        </TabsContent>
        <TabsContent value="disputes" className="mt-4">
          {disputes.length === 0 ? <EmptyState text="No hay disputas activas" /> : disputes.map(r => renderRequest(r))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16">
      <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}
