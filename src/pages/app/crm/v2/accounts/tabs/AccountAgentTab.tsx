/**
 * Account Agent Tab — Visible when crm_accounts.is_agent = true
 * Shows agent-specific features: sub-clients, bulk instructions, permissions
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Plus, Eye, Edit, Unlink, Send, ShieldCheck, ShieldAlert,
  Briefcase, ExternalLink, FileText, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface AccountAgentTabProps {
  accountId: string;
  accountName: string;
  isAgent: boolean;
  isLicensedAgent?: boolean;
  agentLicenseType?: string | null;
  billingType?: string;
  discountPct?: number;
  portalType?: string;
}

// Mock sub-clients
const MOCK_SUB_CLIENTS = [
  { id: 'r1', client_id: 'c1', client_name: 'Startup XYZ', since: '01/2022', matters: 12, urgent: 2, billing: 'agent' },
  { id: 'r2', client_id: 'c2', client_name: 'TechCorp', since: '03/2023', matters: 8, urgent: 1, billing: 'client' },
  { id: 'r3', client_id: 'c3', client_name: 'NewCo', since: '06/2024', matters: 5, urgent: 0, billing: 'agent' },
];

export function AccountAgentTab({
  accountId, accountName, isAgent, isLicensedAgent = false,
  agentLicenseType, billingType = 'per_matter', discountPct = 0, portalType = 'client'
}: AccountAgentTabProps) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showBulkInstruction, setShowBulkInstruction] = useState(false);
  const [agentRefWrite, setAgentRefWrite] = useState(true);
  const [agentRefApproval, setAgentRefApproval] = useState(false);
  const [statusWrite, setStatusWrite] = useState(true);
  const [statusApproval, setStatusApproval] = useState(true);
  const [bulkForm, setBulkForm] = useState({ title: '', description: '', urgent: false, deadline: '' });

  if (!isAgent) return null;

  return (
    <div className="space-y-6">
      {/* Section 1: Agent Status Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-sm px-3 py-1">🤝 Agente PI</Badge>
              {isLicensedAgent ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
                  <ShieldCheck className="w-3 h-3" /> Habilitado
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1">
                  <ShieldAlert className="w-3 h-3" /> Sin verificar
                </Badge>
              )}
              {agentLicenseType && (
                <Badge variant="outline" className="text-xs">{agentLicenseType}</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Ver portal del agente
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Facturación</span>
              <div className="font-medium">{billingType === 'per_matter' ? 'Por expediente' : billingType === 'consolidated' ? 'Consolidada mensual' : 'Retainer'}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Descuento</span>
              <div className="font-medium">{discountPct}%</div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Portal</span>
              <div className="font-medium">{portalType === 'agent' ? 'Activo ✓' : 'No activado'}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Sub-clientes</span>
              <div className="font-medium">{MOCK_SUB_CLIENTS.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Sub-clients portfolio */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Cartera de clientes del agente
            </CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setShowAddClient(true)}>
              <Plus className="w-3 h-3" /> Añadir cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Rel. desde</th>
                  <th className="py-2 pr-3">Expedientes</th>
                  <th className="py-2 pr-3">Urgentes</th>
                  <th className="py-2 pr-3">Facturación</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SUB_CLIENTS.map(sc => (
                  <tr key={sc.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{sc.client_name}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{sc.since}</td>
                    <td className="py-2.5 pr-3">{sc.matters}</td>
                    <td className="py-2.5 pr-3">
                      {sc.urgent > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">🔴 {sc.urgent}</Badge>
                      ) : (
                        <span className="text-emerald-600 text-xs">✓</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{sc.billing === 'agent' ? 'Agente paga' : 'Cliente paga'}</td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Unlink className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Matters grouped by client */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Expedientes por cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_SUB_CLIENTS.map(sc => (
            <div key={sc.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">▼ {sc.client_name} ({sc.matters} expedientes)</span>
                <Button variant="link" size="sm" className="text-xs h-auto p-0">Ver todos →</Button>
              </div>
              <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                {['NEXUS — EUIPO ✓', 'NEXUS — USPTO ⏳', 'ALPHA — EUIPO ✓'].slice(0, Math.min(3, sc.matters)).map((m, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
                ))}
                {sc.matters > 3 && <span className="text-muted-foreground">+{sc.matters - 3} más</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 4: Bulk instructions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="w-4 h-4" /> Instrucciones masivas
            </CardTitle>
            <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setShowBulkInstruction(true)}>
              <Send className="w-3 h-3" /> Enviar instrucción masiva
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Envía instrucciones a múltiples expedientes de este agente simultáneamente.</p>
        </CardContent>
      </Card>

      {/* Section 5: Write permissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">¿Qué puede modificar este agente en los expedientes?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Referencia del agente</Label>
              <p className="text-xs text-muted-foreground">El agente puede actualizar su referencia interna</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Switch checked={agentRefWrite} onCheckedChange={setAgentRefWrite} />
                <span className="text-xs">Escritura</span>
              </div>
              {agentRefWrite && (
                <div className="flex items-center gap-1.5">
                  <Switch checked={agentRefApproval} onCheckedChange={setAgentRefApproval} />
                  <span className="text-xs">Requiere aprobación</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Estado del expediente</Label>
              <p className="text-xs text-muted-foreground">El agente puede proponer cambios de estado</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Switch checked={statusWrite} onCheckedChange={setStatusWrite} />
                <span className="text-xs">Escritura</span>
              </div>
              {statusWrite && (
                <div className="flex items-center gap-1.5">
                  <Switch checked={statusApproval} onCheckedChange={setStatusApproval} />
                  <span className="text-xs">Requiere aprobación</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Añadir cliente a la cartera</DialogTitle>
            <DialogDescription className="text-xs">Selecciona un cliente existente del CRM</DialogDescription>
          </DialogHeader>
          <Input placeholder="Buscar cliente..." />
          <div className="space-y-1.5 max-h-48 overflow-auto text-sm">
            {['Innovatech S.L.', 'Global Patents LLC', 'Design Hub'].map(name => (
              <Button key={name} variant="ghost" className="w-full justify-start h-auto py-2" onClick={() => { toast.success(`${name} añadido a la cartera`); setShowAddClient(false); }}>
                {name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Instruction Modal */}
      <Dialog open={showBulkInstruction} onOpenChange={setShowBulkInstruction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Enviar instrucción masiva</DialogTitle>
            <DialogDescription className="text-xs">Se enviará a todos los expedientes seleccionados de {accountName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título</Label>
              <Input value={bulkForm.title} onChange={e => setBulkForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Renovar todas las marcas" />
            </div>
            <div>
              <Label className="text-xs">Instrucciones</Label>
              <Textarea value={bulkForm.description} onChange={e => setBulkForm(p => ({ ...p, description: e.target.value }))} placeholder="Detalles de la instrucción..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={bulkForm.urgent} onCheckedChange={v => setBulkForm(p => ({ ...p, urgent: v }))} />
              <Label className="text-xs">Marcar como urgente</Label>
            </div>
            <div>
              <Label className="text-xs">Fecha límite (opcional)</Label>
              <Input type="date" value={bulkForm.deadline} onChange={e => setBulkForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { toast.success('Instrucción masiva enviada'); setShowBulkInstruction(false); }}>
              <Send className="w-3.5 h-3.5 mr-1" /> Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
