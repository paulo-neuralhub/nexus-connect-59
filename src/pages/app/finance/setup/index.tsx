// =============================================
// FinanceSetupWizard — 4-step fiscal configuration wizard
// Shows when fin_fiscal_configs doesn't exist for the tenant
// =============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Building2, FileText, CreditCard, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useCountriesConfig, useUpsertFiscalConfig } from '@/hooks/finance/useFiscalConfig';
import { useTaxRates } from '@/hooks/finance/useFiscalConfig';
import { useFinanceModuleConfig } from '@/hooks/finance/useFinanceModuleConfig';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'País', icon: Globe },
  { id: 2, label: 'Datos fiscales', icon: Building2 },
  { id: 3, label: 'Impuestos', icon: FileText },
  { id: 4, label: 'Bancario', icon: CreditCard },
];

export default function FinanceSetupWizard() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const [step, setStep] = useState(1);

  // Form state
  const [countryCode, setCountryCode] = useState('ES');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState('NIF');
  const [vatNumber, setVatNumber] = useState('');
  const [vatRegime, setVatRegime] = useState('general');
  const [appliesIrpf, setAppliesIrpf] = useState(false);
  const [irpfRate, setIrpfRate] = useState(15);
  const [siiEnabled, setSiiEnabled] = useState(false);
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [bankName, setBankName] = useState('');

  // Queries
  const { data: countries = [] } = useCountriesConfig();
  const { data: taxRates = [] } = useTaxRates(countryCode);
  const { data: moduleConfig } = useFinanceModuleConfig();
  const upsertFiscal = useUpsertFiscalConfig();

  const selectedCountry = countries.find(c => c.country_code === countryCode);
  const isSpain = countryCode === 'ES';
  const vatRates = taxRates.filter(r => r.tax_type === 'vat');

  const handleSave = async () => {
    if (!legalName.trim() || !taxId.trim()) {
      toast.error('Completa los campos obligatorios: Razón social y NIF/CIF');
      return;
    }

    try {
      await upsertFiscal.mutateAsync({
        organization_id: currentOrganization!.id,
        legal_name: legalName,
        tax_id: taxId,
        tax_id_type: taxIdType,
        vat_number: vatNumber || null,
        country_code: countryCode,
        vat_regime: vatRegime,
        vat_registered: true,
        applies_irpf: appliesIrpf,
        default_irpf_rate: appliesIrpf ? irpfRate : 0,
        sii_enabled: siiEnabled,
        verifactu_enabled: isSpain,
        bank_account_iban: iban || null,
        bank_account_bic: bic || null,
        bank_name: bankName || null,
        fiscal_address: {},
        accounting_standard: selectedCountry?.default_accounting_standard || 'pgc',
      });
      toast.success('Configuración fiscal guardada correctamente');
      navigate('/app/finance');
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!countryCode;
    if (step === 2) return !!legalName.trim() && !!taxId.trim();
    return true;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración fiscal</h1>
        <p className="text-muted-foreground">Configura tu información fiscal antes de usar el módulo financiero</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <div className={cn("h-px w-8", isDone ? "bg-primary" : "bg-border")} />}
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-primary/10 text-primary cursor-pointer",
                  !isActive && !isDone && "text-muted-foreground"
                )}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                {s.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Step 1: Country */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>País principal del despacho</CardTitle>
            <CardDescription>Selecciona el país donde opera tu despacho. Esto determina las normas fiscales aplicables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>País *</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.country_code} value={c.country_code}>
                      {c.country_name} ({c.country_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCountry && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h4 className="font-medium text-sm">{selectedCountry.country_name}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">IVA estándar:</span>{' '}
                    <span className="font-medium">{selectedCountry.standard_vat_rate}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Moneda:</span>{' '}
                    <span className="font-medium">{selectedCountry.currency_code}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estándar contable:</span>{' '}
                    <span className="font-medium uppercase">{selectedCountry.default_accounting_standard}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Año fiscal desde:</span>{' '}
                    <span className="font-medium">Mes {selectedCountry.fiscal_year_start_month}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedCountry.has_sii && <Badge variant="secondary">SII</Badge>}
                  {selectedCountry.has_verifactu && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" /> Verifactu obligatorio julio 2027
                    </Badge>
                  )}
                  {selectedCountry.has_saft && <Badge variant="secondary">SAF-T</Badge>}
                  {selectedCountry.has_mtd && <Badge variant="secondary">MTD</Badge>}
                  {selectedCountry.has_fec && <Badge variant="secondary">FEC</Badge>}
                  {selectedCountry.has_gobd && <Badge variant="secondary">GoBD</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Fiscal Data */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Datos fiscales</CardTitle>
            <CardDescription>Información que aparecerá en tus facturas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Razón social *</Label>
              <Input value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Mi Despacho PI S.L." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIF/CIF/VAT *</Label>
                <Input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="B12345678" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de identificación</Label>
                <Select value={taxIdType} onValueChange={setTaxIdType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIF">NIF</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="VAT">VAT Number</SelectItem>
                    <SelectItem value="EIN">EIN (US)</SelectItem>
                    <SelectItem value="CNPJ">CNPJ (BR)</SelectItem>
                    <SelectItem value="RFC">RFC (MX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Número IVA intracomunitario (opcional)</Label>
              <Input value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="ES12345678A" />
              <p className="text-xs text-muted-foreground">Solo si operas en la UE y estás registrado para IVA intracomunitario</p>
            </div>
            <div className="space-y-2">
              <Label>Régimen de IVA</Label>
              <Select value={vatRegime} onValueChange={setVatRegime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="simplified">Simplificado</SelectItem>
                  <SelectItem value="exempt">Exento</SelectItem>
                  {isSpain && <SelectItem value="recargo_equivalencia">Recargo de equivalencia</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Tax Configuration (conditional for Spain) */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{isSpain ? 'Configuración fiscal española' : 'Configuración de impuestos'}</CardTitle>
            <CardDescription>
              {isSpain
                ? 'Configura retenciones IRPF y obligaciones del SII'
                : 'Configura los impuestos aplicables a tu despacho'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isSpain && (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-medium">¿Aplicas retención IRPF?</div>
                    <div className="text-sm text-muted-foreground">
                      Activar si estás en régimen de estimación directa (autónomos y profesionales)
                    </div>
                  </div>
                  <Switch checked={appliesIrpf} onCheckedChange={setAppliesIrpf} />
                </div>

                {appliesIrpf && (
                  <div className="space-y-2 ml-4 pl-4 border-l-2 border-primary/20">
                    <Label>Tipo de retención IRPF</Label>
                    <Select value={String(irpfRate)} onValueChange={v => setIrpfRate(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7% — Nuevo autónomo (primeros 3 años)</SelectItem>
                        <SelectItem value="15">15% — General profesionales</SelectItem>
                        <SelectItem value="19">19% — Arrendamientos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-medium">¿Estás obligado al SII?</div>
                    <div className="text-sm text-muted-foreground">
                      Sí si tu facturación anual supera los 6 millones de euros
                    </div>
                  </div>
                  <Switch checked={siiEnabled} onCheckedChange={setSiiEnabled} />
                </div>

                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Verifactu obligatorio julio 2027</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        El sistema ya soporta la cadena de hashes Verifactu. Se activará automáticamente cuando sea obligatorio.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!isSpain && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tipos de IVA disponibles para <strong>{selectedCountry?.country_name}</strong>:
                </p>
                <div className="space-y-2">
                  {vatRates.length > 0 ? vatRates.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm font-medium">{r.rate_name}</span>
                      <Badge variant="secondary">{r.rate_pct}%</Badge>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground italic">No hay tipos de IVA configurados para este país.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Bank Details */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Datos bancarios</CardTitle>
            <CardDescription>Información para el cobro de facturas. Puedes completarlo más tarde en Configuración.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input value={iban} onChange={e => setIban(e.target.value)} placeholder="ES12 1234 5678 9012 3456 7890" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>BIC/SWIFT</Label>
                <Input value={bic} onChange={e => setBic(e.target.value)} placeholder="ABCDESMM" />
              </div>
              <div className="space-y-2">
                <Label>Nombre del banco</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Mi Banco S.A." />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Estos datos son opcionales. Puedes añadirlos o modificarlos después.</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Siguiente <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={upsertFiscal.isPending}>
            {upsertFiscal.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Guardar y acceder a finanzas
          </Button>
        )}
      </div>
    </div>
  );
}
