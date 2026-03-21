/**
 * Service Request Form — /market/request/:agentSlug
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandingHeader } from '@/components/market/landing/LandingHeader';
import { LandingFooter } from '@/components/market/landing/LandingFooter';
import { useMarketAgentBySlug, useCreateServiceRequest } from '@/hooks/market/useMarketAgentsV3';
import { toast } from 'sonner';

const STEPS = ['Necesidad', 'Tus datos', 'Confirmación'];

export default function ServiceRequestPage() {
  const { agentSlug } = useParams<{ agentSlug: string }>();
  const navigate = useNavigate();
  const { data: agent } = useMarketAgentBySlug(agentSlug);
  const createRequest = useCreateServiceRequest();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    service_type: '',
    jurisdiction_code: '',
    title: '',
    description: '',
    urgency: 'normal',
    brand_name: '',
    nice_classes: '',
    // Step 2
    client_name: '',
    client_email: '',
    client_country: 'ES',
    client_type: 'individual',
    vat_number: '',
    // Consents
    consent_withdrawal: false,
    consent_terms: false,
  });

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const isBusiness = form.client_type === 'business';

  const canNext = () => {
    if (step === 0) return form.service_type && form.jurisdiction_code && form.title;
    if (step === 1) return form.client_name && form.client_email;
    if (step === 2) {
      if (!isBusiness && !form.consent_withdrawal) return false;
      return form.consent_terms;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!agent) return;
    try {
      await createRequest.mutateAsync({
        agent_id: agent.id,
        service_type: form.service_type,
        jurisdiction_code: form.jurisdiction_code,
        title: form.title,
        description: form.description,
        urgency: form.urgency,
        brand_name: form.brand_name || null,
        nice_classes: form.nice_classes ? form.nice_classes.split(',').map(Number).filter(Boolean) : [],
        status: 'published',
      });
      toast.success('Solicitud enviada correctamente');
      navigate('/market/agents/' + agentSlug);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la solicitud');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <LandingHeader />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i <= step ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {agent && <p className="text-sm text-gray-500 mb-4">Solicitud para: <strong>{agent.display_name}</strong></p>}

        {/* Step 1: Need */}
        {step === 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">¿Qué necesitas?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de servicio *</Label>
                <Select value={form.service_type} onValueChange={v => update('service_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trademark_registration">Registro de Marca</SelectItem>
                    <SelectItem value="patent_registration">Patente</SelectItem>
                    <SelectItem value="design_registration">Diseño Industrial</SelectItem>
                    <SelectItem value="opposition">Oposición</SelectItem>
                    <SelectItem value="search">Búsqueda</SelectItem>
                    <SelectItem value="renewal">Renovación</SelectItem>
                    <SelectItem value="surveillance">Vigilancia</SelectItem>
                    <SelectItem value="legal_opinion">Dictamen Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jurisdicción *</Label>
                <Select value={form.jurisdiction_code} onValueChange={v => update('jurisdiction_code', v)}>
                  <SelectTrigger><SelectValue placeholder="¿Dónde?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EM">🇪🇺 EUIPO</SelectItem>
                    <SelectItem value="ES">🇪🇸 España</SelectItem>
                    <SelectItem value="US">🇺🇸 USA</SelectItem>
                    <SelectItem value="GB">🇬🇧 UK</SelectItem>
                    <SelectItem value="DE">🇩🇪 Alemania</SelectItem>
                    <SelectItem value="FR">🇫🇷 Francia</SelectItem>
                    <SelectItem value="JP">🇯🇵 Japón</SelectItem>
                    <SelectItem value="CN">🇨🇳 China</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título de la solicitud *</Label>
                <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ej: Registro marca 'ACME' en EUIPO" />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe tu necesidad con detalle" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de marca</Label>
                  <Input value={form.brand_name} onChange={e => update('brand_name', e.target.value)} placeholder="ACME" />
                </div>
                <div>
                  <Label>Clases Nice (separadas por coma)</Label>
                  <Input value={form.nice_classes} onChange={e => update('nice_classes', e.target.value)} placeholder="9, 35, 42" />
                </div>
              </div>
              <div>
                <Label>Urgencia</Label>
                <Select value={form.urgency} onValueChange={v => update('urgency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Client data */}
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Tus datos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre completo *</Label>
                <Input value={form.client_name} onChange={e => update('client_name', e.target.value)} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} />
              </div>
              <div>
                <Label>País</Label>
                <Select value={form.client_country} onValueChange={v => update('client_country', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ES">España</SelectItem>
                    <SelectItem value="US">Estados Unidos</SelectItem>
                    <SelectItem value="GB">Reino Unido</SelectItem>
                    <SelectItem value="DE">Alemania</SelectItem>
                    <SelectItem value="FR">Francia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de cliente</Label>
                <Select value={form.client_type} onValueChange={v => update('client_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Particular</SelectItem>
                    <SelectItem value="business">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isBusiness && (
                <div>
                  <Label>NIF/VAT (para facturación B2B)</Label>
                  <Input value={form.vat_number} onChange={e => update('vat_number', e.target.value)} placeholder="ESB12345678" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Confirmación y consentimientos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 border text-sm text-gray-700 space-y-2">
                <p><strong>Servicio:</strong> {form.service_type} en {form.jurisdiction_code}</p>
                <p><strong>Título:</strong> {form.title}</p>
                <p><strong>Agente:</strong> {agent?.display_name}</p>
                <p><strong>Cliente:</strong> {form.client_name} ({form.client_type})</p>
              </div>

              {/* B2C Withdrawal consent */}
              {!isBusiness && (
                <div className="flex items-start gap-3 p-4 rounded-lg border" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
                  <Checkbox
                    checked={form.consent_withdrawal}
                    onCheckedChange={(v) => update('consent_withdrawal', !!v)}
                  />
                  <label className="text-xs text-amber-900">
                    Solicito el inicio del servicio antes de los 14 días de desistimiento y acepto que, una vez iniciado, pierdo el derecho de desistimiento conforme a la Directiva EU 2011/83.
                  </label>
                </div>
              )}

              {/* Platform disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <ShieldCheck className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500">
                  El contrato de servicio es entre tú y <strong>{agent?.display_name}</strong>. IP-NEXUS actúa únicamente como plataforma tecnológica de intermediación.
                </p>
              </div>

              {/* T&C consent */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={form.consent_terms}
                  onCheckedChange={(v) => update('consent_terms', !!v)}
                />
                <label className="text-xs text-gray-700">
                  Acepto los <a href="#" className="text-emerald-600 underline">Términos y Condiciones</a> de IP-MARKET.
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> {step === 0 ? 'Volver' : 'Anterior'}
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ background: '#10B981' }} className="text-white">
              Siguiente <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canNext() || createRequest.isPending} style={{ background: '#10B981' }} className="text-white">
              {createRequest.isPending ? 'Enviando...' : 'Enviar solicitud →'}
            </Button>
          )}
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
