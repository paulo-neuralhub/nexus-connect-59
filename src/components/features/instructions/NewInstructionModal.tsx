// @ts-nocheck
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, ArrowLeft, ArrowRight, Check, Mail, MessageCircle, Globe, Phone, Video, FileText, Loader2 } from 'lucide-react';
import { useCreateInstruction } from '@/hooks/use-instructions';
import { useCRMAccounts } from '@/hooks/crm/v2/accounts';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHANNELS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'portal', label: 'Portal', icon: Globe },
  { value: 'phone', label: 'Teléfono', icon: Phone },
  { value: 'meeting', label: 'Reunión', icon: Video },
  { value: 'letter', label: 'Carta', icon: FileText },
];

const URGENCY = [
  { value: 'normal', label: 'Normal', color: 'bg-muted text-muted-foreground' },
  { value: 'urgent', label: 'Urgente', color: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: '🔴 Crítico', color: 'bg-red-100 text-red-700' },
];

const SERVICE_TYPES = [
  { value: 'trademark_registration', label: 'Registro de marca' },
  { value: 'patent_application', label: 'Solicitud de patente' },
  { value: 'renewal', label: 'Renovación' },
  { value: 'opposition', label: 'Oposición' },
  { value: 'surveillance', label: 'Vigilancia' },
  { value: 'assignment', label: 'Cambio de titular' },
  { value: 'design', label: 'Diseño industrial' },
  { value: 'other', label: 'Otro' },
];

const JURISDICTION_GROUPS = {
  'Europa': ['EU', 'ES', 'FR', 'DE', 'IT', 'GB', 'PT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'IE'],
  'Américas': ['US', 'CA', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE'],
  'Asia-Pacífico': ['CN', 'JP', 'KR', 'AU', 'IN', 'SG', 'TW', 'NZ', 'TH'],
  'Oriente Medio': ['AE', 'SA', 'IL', 'TR'],
  'África': ['ZA', 'EG', 'MA', 'NG'],
  'Internacional': ['PCT', 'WIPO'],
};

export function NewInstructionModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1);
  const createInstruction = useCreateInstruction();
  const { data: accounts = [] } = useCRMAccounts();

  // Form state
  const [clientId, setClientId] = useState('');
  const [channel, setChannel] = useState('email');
  const [urgency, setUrgency] = useState('normal');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [serviceType, setServiceType] = useState('');
  const [markName, setMarkName] = useState('');
  const [inventionTitle, setInventionTitle] = useState('');
  const [niceClasses, setNiceClasses] = useState<number[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [sendAcknowledgement, setSendAcknowledgement] = useState(true);
  const [checkConflicts, setCheckConflicts] = useState(true);

  const selectedClient = accounts.find((a: any) => a.id === clientId);
  const totalSteps = 6;

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('genius-analyze-instruction', {
        body: { instruction_text: description, client_id: clientId },
      });
      if (error) throw error;
      setAnalysisResult(data);
      // Pre-fill from analysis
      if (data?.service_type) setServiceType(data.service_type);
      if (data?.mark_name) setMarkName(data.mark_name);
      if (data?.invention_title) setInventionTitle(data.invention_title);
      if (data?.jurisdictions?.length) setSelectedJurisdictions(data.jurisdictions);
      if (data?.nice_classes?.length) setNiceClasses(data.nice_classes);
      if (data?.urgency === 'urgent') setUrgency('urgent');
      if (data?.urgency === 'critical') setUrgency('critical');
      toast.success('IP-GENIUS ha analizado la instrucción');
    } catch {
      toast.error('No se pudo analizar la instrucción. Puedes continuar manualmente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleJurisdiction = (code: string) => {
    setSelectedJurisdictions(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleCreate = async (asDraft = false) => {
    const title = markName || inventionTitle || 'Nueva instrucción';
    await createInstruction.mutateAsync({
      title,
      description,
      instruction_type: serviceType || 'other',
      crm_account_id: clientId || undefined,
      source: channel,
      is_urgent: urgency !== 'normal',
      deadline_date: deadlineDate || undefined,
      jurisdictions: selectedJurisdictions,
      status: asDraft ? 'draft' : 'sent',
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setClientId('');
    setChannel('email');
    setUrgency('normal');
    setDescription('');
    setAnalysisResult(null);
    setServiceType('');
    setMarkName('');
    setInventionTitle('');
    setNiceClasses([]);
    setSelectedJurisdictions([]);
    setDeadlineDate('');
    setSendAcknowledgement(true);
    setCheckConflicts(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] max-h-[85vh] overflow-y-auto p-0">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">
                Nueva Instrucción
              </DialogTitle>
              <span className="text-xs text-muted-foreground">Paso {step} de {totalSteps}</span>
            </div>
          </DialogHeader>

          {/* STEP 1 — Client & Source */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="font-semibold">¿De quién viene la instrucción?</h3>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClient && (
                  <p className="text-xs text-muted-foreground">
                    {selectedClient.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Canal de recepción</Label>
                <div className="flex gap-2 flex-wrap">
                  {CHANNELS.map(ch => {
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.value}
                        onClick={() => setChannel(ch.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                          channel === ch.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Urgencia</Label>
                <div className="flex gap-2">
                  {URGENCY.map(u => (
                    <button
                      key={u.value}
                      onClick={() => setUrgency(u.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                        urgency === u.value
                          ? u.color + ' border-current'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha recepción</Label>
                <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 2 — Description */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-semibold">¿Qué solicita el cliente?</h3>

              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder='Ejemplo: "Hi, we would like to register our new brand VERDE PURE BIO in the EU, US and UK for cosmetics (class 3) and retail (class 35). Please provide a quote..."'
                className="min-h-[160px] text-sm"
              />

              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !description.trim()}
                variant="outline"
                className="gap-2 w-full"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-500" />
                )}
                {analyzing ? 'Analizando...' : '✨ Analizar con IP-GENIUS'}
              </Button>

              {analysisResult && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> IP-GENIUS ha detectado:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-amber-900">
                    {analysisResult.service_type && (
                      <div><span className="text-amber-600">Tipo:</span> {analysisResult.service_type}</div>
                    )}
                    {analysisResult.mark_name && (
                      <div><span className="text-amber-600">Marca:</span> {analysisResult.mark_name}</div>
                    )}
                    {analysisResult.jurisdictions?.length > 0 && (
                      <div><span className="text-amber-600">Países:</span> {analysisResult.jurisdictions.join(', ')}</div>
                    )}
                    {analysisResult.nice_classes?.length > 0 && (
                      <div><span className="text-amber-600">Clases:</span> {analysisResult.nice_classes.join(', ')}</div>
                    )}
                  </div>
                  {analysisResult.potential_conflicts?.length > 0 && (
                    <div className="text-xs text-red-700 mt-1">
                      ⚠️ {analysisResult.potential_conflicts.length} conflicto(s) potencial(es)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Service type */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-semibold">Detalles del servicio</h3>

              <div className="space-y-2">
                <Label>Tipo de servicio</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(st => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(serviceType === 'trademark_registration' || serviceType === 'opposition') && (
                <>
                  <div className="space-y-2">
                    <Label>Nombre de la marca</Label>
                    <Input value={markName} onChange={e => setMarkName(e.target.value)} placeholder="VERDE PURE BIO" />
                  </div>
                  <div className="space-y-2">
                    <Label>Clases Nice</Label>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: 45 }, (_, i) => i + 1).map(cls => (
                        <button
                          key={cls}
                          onClick={() => setNiceClasses(prev =>
                            prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
                          )}
                          className={cn(
                            'w-8 h-8 rounded text-xs font-medium border transition-colors',
                            niceClasses.includes(cls)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                          )}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                    {niceClasses.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Seleccionadas: {niceClasses.sort((a, b) => a - b).join(', ')}
                      </p>
                    )}
                  </div>
                </>
              )}

              {serviceType === 'patent_application' && (
                <>
                  <div className="space-y-2">
                    <Label>Título de la invención</Label>
                    <Input value={inventionTitle} onChange={e => setInventionTitle(e.target.value)} placeholder="Sistema IoT de sensores..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción técnica breve</Label>
                    <Textarea placeholder="Breve descripción de la invención..." className="min-h-[80px]" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4 — Jurisdictions */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="font-semibold">¿En qué países?</h3>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {Object.entries(JURISDICTION_GROUPS).map(([region, codes]) => (
                  <div key={region}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {region}
                    </h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {codes.map(code => (
                        <button
                          key={code}
                          onClick={() => toggleJurisdiction(code)}
                          className={cn(
                            'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
                            selectedJurisdictions.includes(code)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
                          )}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedJurisdictions.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="font-medium">{selectedJurisdictions.length} países seleccionados</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5 — Summary & Quote */}
          {step === 5 && (
            <div className="space-y-5">
              <h3 className="font-semibold">Resumen de la instrucción</h3>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{selectedClient?.name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{SERVICE_TYPES.find(s => s.value === serviceType)?.label || '—'}</span></div>
                  <div><span className="text-muted-foreground">Marca/Invención:</span> <span className="font-medium">{markName || inventionTitle || '—'}</span></div>
                  <div><span className="text-muted-foreground">Urgencia:</span> <span className="font-medium">{URGENCY.find(u => u.value === urgency)?.label}</span></div>
                </div>
                {selectedJurisdictions.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Jurisdicciones:</span>{' '}
                    <span className="font-medium">{selectedJurisdictions.join(', ')}</span>
                  </div>
                )}
                {niceClasses.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Clases:</span>{' '}
                    <span className="font-medium">{niceClasses.sort((a, b) => a - b).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Estimated quote table */}
              {selectedJurisdictions.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Jurisdicción</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Tasas est.</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Honorarios est.</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJurisdictions.map(jur => {
                        const fees = jur === 'EU' ? 850 : jur === 'US' ? 350 : 200;
                        const honorarios = jur === 'US' ? 1500 : jur === 'EU' ? 1200 : 800;
                        return (
                          <tr key={jur} className="border-b last:border-b-0">
                            <td className="px-3 py-2 font-medium">{jur}</td>
                            <td className="px-3 py-2 text-right">€{fees.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right">€{honorarios.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-semibold">€{(fees + honorarios).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="px-3 py-2">TOTAL</td>
                        <td className="px-3 py-2 text-right">
                          €{selectedJurisdictions.reduce((s, j) => s + (j === 'EU' ? 850 : j === 'US' ? 350 : 200), 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          €{selectedJurisdictions.reduce((s, j) => s + (j === 'US' ? 1500 : j === 'EU' ? 1200 : 800), 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          €{selectedJurisdictions.reduce((s, j) => {
                            const f = j === 'EU' ? 850 : j === 'US' ? 350 : 200;
                            const h = j === 'US' ? 1500 : j === 'EU' ? 1200 : 800;
                            return s + f + h;
                          }, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="space-y-2">
                <Label>Deadline del cliente (opcional)</Label>
                <Input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 6 — Confirm */}
          {step === 6 && (
            <div className="space-y-5">
              <h3 className="font-semibold">¿Todo correcto?</h3>

              <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                <p><strong>{markName || inventionTitle || 'Instrucción'}</strong> para {selectedClient?.name || 'cliente'}</p>
                <p>{selectedJurisdictions.length} jurisdicciones · {SERVICE_TYPES.find(s => s.value === serviceType)?.label}</p>
                <p>Canal: {SOURCE_LABELS[channel]} · Urgencia: {URGENCY.find(u => u.value === urgency)?.label}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ack"
                    checked={sendAcknowledgement}
                    onCheckedChange={(v) => setSendAcknowledgement(!!v)}
                  />
                  <label htmlFor="ack" className="text-sm">Enviar acuse de recibo al cliente</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="conflicts"
                    checked={checkConflicts}
                    onCheckedChange={(v) => setCheckConflicts(!!v)}
                  />
                  <label htmlFor="conflicts" className="text-sm">Verificar conflictos automáticamente</label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {step > 1 ? 'Anterior' : 'Cancelar'}
            </Button>

            <div className="flex gap-2">
              {step === 6 && (
                <Button
                  variant="outline"
                  onClick={() => handleCreate(true)}
                  disabled={createInstruction.isPending}
                >
                  Guardar borrador
                </Button>
              )}
              {step < 6 ? (
                <Button onClick={() => setStep(step + 1)} className="gap-1.5">
                  Siguiente <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleCreate(false)}
                  disabled={createInstruction.isPending}
                  className="gap-1.5"
                >
                  {createInstruction.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Crear Instrucción
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
