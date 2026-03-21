// =============================================
// FinanceSettingsPage — Connected to fin_fiscal_configs
// Tabs: Datos Fiscales | Impuestos | Facturación | Bancario
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, FileText, CreditCard, Receipt, Save, Loader2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import { useFiscalConfig, useUpsertFiscalConfig, useTaxRates } from '@/hooks/finance/useFiscalConfig';
import { useInvoiceSeries } from '@/hooks/finance/useFiscalSettings';
import { useFinanceModuleConfig, useUpdateFinanceModuleConfig } from '@/hooks/finance/useFinanceModuleConfig';
import { toast } from 'sonner';

export default function FinanceSettingsPage() {
  usePageTitle('Configuración Finance');
  const navigate = useNavigate();
  const { data: fiscalConfig, isLoading: loadingFiscal } = useFiscalConfig();
  const { data: moduleConfig } = useFinanceModuleConfig();
  const { data: series = [] } = useInvoiceSeries();
  const upsertFiscal = useUpsertFiscalConfig();
  const updateModule = useUpdateFinanceModuleConfig();

  // Redirect to wizard if no config
  useEffect(() => {
    if (!loadingFiscal && !fiscalConfig) {
      navigate('/app/finance/setup');
    }
  }, [loadingFiscal, fiscalConfig, navigate]);

  // Fiscal form state
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState('NIF');
  const [vatNumber, setVatNumber] = useState('');
  const [vatRegime, setVatRegime] = useState('general');
  const [countryCode, setCountryCode] = useState('ES');
  const [appliesIrpf, setAppliesIrpf] = useState(false);
  const [irpfRate, setIrpfRate] = useState(15);
  const [siiEnabled, setSiiEnabled] = useState(false);
  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [bankName, setBankName] = useState('');

  // Module config state
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [defaultLanguage, setDefaultLanguage] = useState('es');

  const { data: taxRates = [] } = useTaxRates(countryCode);

  // Load data
  useEffect(() => {
    if (fiscalConfig) {
      setLegalName(fiscalConfig.legal_name || '');
      setTaxId(fiscalConfig.tax_id || '');
      setTaxIdType(fiscalConfig.tax_id_type || 'NIF');
      setVatNumber(fiscalConfig.vat_number || '');
      setVatRegime(fiscalConfig.vat_regime || 'general');
      setCountryCode(fiscalConfig.country_code || 'ES');
      setAppliesIrpf(fiscalConfig.applies_irpf || false);
      setIrpfRate(fiscalConfig.default_irpf_rate || 15);
      setSiiEnabled(fiscalConfig.sii_enabled || false);
      setVerifactuEnabled(fiscalConfig.verifactu_enabled || false);
      setIban(fiscalConfig.bank_account_iban || '');
      setBic(fiscalConfig.bank_account_bic || '');
      setBankName(fiscalConfig.bank_name || '');
    }
    if (moduleConfig) {
      setInvoiceFooter(moduleConfig.invoice_footer_text || '');
      setPaymentTerms(moduleConfig.default_payment_terms_days || 30);
      setDefaultLanguage(moduleConfig.default_invoice_language || 'es');
    }
  }, [fiscalConfig, moduleConfig]);

  const handleSaveFiscal = async () => {
    try {
      await upsertFiscal.mutateAsync({
        legal_name: legalName,
        tax_id: taxId,
        tax_id_type: taxIdType,
        vat_number: vatNumber || null,
        country_code: countryCode,
        vat_regime: vatRegime,
        applies_irpf: appliesIrpf,
        default_irpf_rate: appliesIrpf ? irpfRate : 0,
        sii_enabled: siiEnabled,
        verifactu_enabled: verifactuEnabled,
        bank_account_iban: iban || null,
        bank_account_bic: bic || null,
        bank_name: bankName || null,
      });
      toast.success('Configuración fiscal guardada');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleSaveModule = async () => {
    try {
      await updateModule.mutateAsync({
        invoice_footer_text: invoiceFooter || null,
        default_payment_terms_days: paymentTerms,
        default_invoice_language: defaultLanguage,
      });
      toast.success('Configuración de facturación guardada');
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  if (loadingFiscal) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!fiscalConfig) return null;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Configuración financiera</h1>
        <p className="text-muted-foreground">Datos fiscales, impuestos, facturación y bancario</p>
      </div>

      <Tabs defaultValue="fiscal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fiscal" className="gap-2"><Building2 className="w-4 h-4" /> Datos fiscales</TabsTrigger>
          <TabsTrigger value="taxes" className="gap-2"><Receipt className="w-4 h-4" /> Impuestos</TabsTrigger>
          <TabsTrigger value="invoicing" className="gap-2"><FileText className="w-4 h-4" /> Facturación</TabsTrigger>
          <TabsTrigger value="bank" className="gap-2"><CreditCard className="w-4 h-4" /> Bancario</TabsTrigger>
        </TabsList>

        {/* Tab: Datos Fiscales */}
        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la empresa</CardTitle>
              <CardDescription>Información fiscal que aparece en facturas y presupuestos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razón social</Label>
                  <Input value={legalName} onChange={e => setLegalName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{taxIdType}</Label>
                  <Input value={taxId} onChange={e => setTaxId(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número IVA intracomunitario</Label>
                  <Input value={vatNumber} onChange={e => setVatNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Régimen de IVA</Label>
                  <Select value={vatRegime} onValueChange={setVatRegime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="simplified">Simplificado</SelectItem>
                      <SelectItem value="exempt">Exento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {countryCode === 'ES' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Retención IRPF</div>
                        <div className="text-sm text-muted-foreground">
                          {appliesIrpf ? `${irpfRate}% sobre honorarios` : 'No aplica'}
                        </div>
                      </div>
                      <Switch checked={appliesIrpf} onCheckedChange={setAppliesIrpf} />
                    </div>
                    {appliesIrpf && (
                      <Select value={String(irpfRate)} onValueChange={v => setIrpfRate(Number(v))}>
                        <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7% — Nuevo autónomo</SelectItem>
                          <SelectItem value="15">15% — General</SelectItem>
                          <SelectItem value="19">19% — Arrendamientos</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">SII (Suministro Inmediato de Información)</div>
                        <div className="text-sm text-muted-foreground">Obligatorio si facturación &gt; 6M€/año</div>
                      </div>
                      <Switch checked={siiEnabled} onCheckedChange={setSiiEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Verifactu</div>
                        <div className="text-sm text-muted-foreground">Obligatorio julio 2027</div>
                      </div>
                      <Switch checked={verifactuEnabled} onCheckedChange={setVerifactuEnabled} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveFiscal} disabled={upsertFiscal.isPending}>
                  {upsertFiscal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Impuestos */}
        <TabsContent value="taxes">
          <Card>
            <CardHeader>
              <CardTitle>Tipos impositivos ({countryCode})</CardTitle>
              <CardDescription>Tasas de IVA e IRPF aplicables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taxRates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No hay tipos configurados para este país</p>
                ) : (
                  taxRates.map(rate => (
                    <div key={rate.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium text-sm">{rate.rate_name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{rate.tax_type}</Badge>
                          {rate.is_default && <Badge variant="secondary" className="text-xs">Predeterminado</Badge>}
                        </div>
                      </div>
                      <span className="text-lg font-bold">{rate.rate_pct}%</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Facturación */}
        <TabsContent value="invoicing">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de facturación</CardTitle>
              <CardDescription>Series, idioma y texto de facturas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Series de facturación activas</Label>
                <div className="space-y-2">
                  {series.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay series creadas. Se usará la serie por defecto "F".</p>
                  ) : (
                    series.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <span className="font-mono font-medium">{s.code}</span>
                          <span className="text-muted-foreground text-sm ml-2">{s.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Último: #{s.current_number}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idioma por defecto</Label>
                  <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plazo de pago (días)</Label>
                  <Input type="number" value={paymentTerms} onChange={e => setPaymentTerms(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pie de factura</Label>
                <Textarea
                  value={invoiceFooter}
                  onChange={e => setInvoiceFooter(e.target.value)}
                  placeholder="Texto que aparecerá al pie de todas las facturas..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveModule} disabled={updateModule.isPending}>
                  {updateModule.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Bancario */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Datos bancarios</CardTitle>
              <CardDescription>Información de cobro para facturas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={iban} onChange={e => setIban(e.target.value)} placeholder="ES12 1234 5678 9012 3456 7890" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BIC/SWIFT</Label>
                  <Input value={bic} onChange={e => setBic(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nombre del banco</Label>
                  <Input value={bankName} onChange={e => setBankName(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveFiscal} disabled={upsertFiscal.isPending}>
                  {upsertFiscal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
