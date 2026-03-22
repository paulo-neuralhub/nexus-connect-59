/**
 * Agent Inbox — /portal/:slug/agent/inbox
 * Instrucciones pendientes del despacho
 */
import { useState } from 'react';
import { useAgentPortalContext } from './AgentPortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, MessageSquare, Flag, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Instruction {
  id: string;
  title: string;
  client: string;
  matter_ref: string;
  matter_title: string;
  deadline: string;
  description: string;
  urgent: boolean;
  status: 'received' | 'confirmed' | 'executed';
  time: string;
}

const MOCK_INSTRUCTIONS: Instruction[] = [
  { id: 'i1', title: 'Renovar marca NEXUS en EUIPO', client: 'Startup XYZ', matter_ref: 'NX-2024-001', matter_title: 'NEXUS — EUIPO', deadline: '15/05/2026', description: 'Proceder con la renovación urgente de la marca NEXUS. Enviar formulario de renovación y pagar tasas oficiales.', urgent: true, status: 'received', time: 'hace 2 horas' },
  { id: 'i2', title: 'Responder OA USPTO ALPHA', client: 'TechCorp', matter_ref: 'AL-2025-001', matter_title: 'ALPHA — USPTO', deadline: '20/05/2026', description: 'Preparar respuesta a la Office Action recibida. El examinador solicita mayor distinción de la clase 9.', urgent: false, status: 'received', time: 'hace 5 horas' },
  { id: 'i3', title: 'Confirmar registro BETA OEPM', client: 'Startup XYZ', matter_ref: 'BT-2024-001', matter_title: 'BETA — OEPM', deadline: '01/06/2026', description: 'Confirmar recepción del certificado de registro y actualizar estado del expediente.', urgent: false, status: 'received', time: 'ayer' },
  { id: 'i4', title: 'Vigilancia de marcas Q1', client: 'TechCorp', matter_ref: 'TC-WATCH', matter_title: 'Vigilancia general', deadline: '30/04/2026', description: 'Enviar informe de vigilancia del Q1 para todas las marcas del cliente.', urgent: false, status: 'confirmed', time: 'hace 3 días' },
  { id: 'i5', title: 'Pago tasas renovación GAMMA', client: 'Startup XYZ', matter_ref: 'GM-2024-001', matter_title: 'GAMMA — OEPM', deadline: '15/03/2026', description: 'Tasas pagadas y renovación procesada.', urgent: false, status: 'executed', time: 'hace 1 semana' },
];

export default function AgentInboxPage() {
  const { clients } = useAgentPortalContext();
  const [tab, setTab] = useState('received');
  const [clientFilter, setClientFilter] = useState('all');
  const [instructions, setInstructions] = useState(MOCK_INSTRUCTIONS);

  const filtered = instructions
    .filter(i => tab === 'all' || i.status === tab)
    .filter(i => clientFilter === 'all' || i.client === clients.find(c => c.client_account_id === clientFilter)?.name);

  const pendingCount = instructions.filter(i => i.status === 'received').length;
  const confirmedCount = instructions.filter(i => i.status === 'confirmed').length;

  const confirmInstruction = (id: string) => {
    setInstructions(prev => prev.map(i => i.id === id ? { ...i, status: 'confirmed' as const } : i));
    toast.success('Instrucción confirmada. El despacho ha sido notificado.');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold">Instrucciones</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="received" className="text-xs gap-1">
              Pendientes {pendingCount > 0 && <Badge variant="destructive" className="h-4 px-1 text-[9px]">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs">Confirmadas ({confirmedCount})</TabsTrigger>
            <TabsTrigger value="executed" className="text-xs">Ejecutadas</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {clients.map(c => (
              <SelectItem key={c.client_account_id} value={c.client_account_id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay instrucciones en esta categoría</p>
          </div>
        )}
        {filtered.map(inst => (
          <Card key={inst.id} className={inst.urgent && inst.status === 'received' ? 'border-red-200 bg-red-50/30' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {inst.urgent && inst.status === 'received' && (
                      <Badge variant="destructive" className="text-[10px]">🔴 URGENTE</Badge>
                    )}
                    {inst.status === 'confirmed' && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">✓ Confirmada</Badge>
                    )}
                    {inst.status === 'executed' && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">✅ Ejecutada</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{inst.time}</span>
                  </div>
                  <h3 className="font-semibold text-sm">{inst.title}</h3>
                  <div className="text-xs text-muted-foreground">
                    Cliente: {inst.client} · Expediente: {inst.matter_title} ({inst.matter_ref})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Fecha límite: <span className="font-medium text-foreground">{inst.deadline}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded">
                    "{inst.description}"
                  </div>
                </div>

                {inst.status === 'received' && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => confirmInstruction(inst.id)}>
                      <Check className="w-3 h-3" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <MessageSquare className="w-3 h-3" /> Consultar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                      <Flag className="w-3 h-3" /> Escalar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
