import { useState } from 'react';
import { Check, Minus, Plus, Rocket, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePlanConfigurator } from '@/hooks/usePlanConfigurator';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BillingAddon } from '@/hooks/useBillingData';

const MODULE_LABELS: Record<string, string> = {
  docket: 'Docket', crm: 'CRM', finance: 'Finanzas', finance_basic: 'Finanzas Básicas',
  communications: 'Comunicaciones', automations: 'Automatizaciones', spider: 'IP-SPIDER',
  genius: 'IP-GENIUS', market: 'IP-MARKET', filing: 'Filing', analytics: 'Analytics',
  api: 'API', sso: 'SSO', accounting_basic: 'Contabilidad', accounting_advanced: 'Contab. Avanzada',
};

export default function SubscriptionPlansPage() {
  const config = usePlanConfigurator();
  const { user } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comments, setComments] = useState('');

  const spiderAddons = config.addons.filter(a => a.category === 'module_standalone' && a.module_code === 'spider');
  const geniusAddons = config.addons.filter(a => a.category === 'module_standalone' && a.module_code === 'genius');
  const marketAddon = config.addons.find(a => a.module_code === 'market');
  const jurisdictionPacks = config.addons.filter(a => a.category === 'jurisdiction_pack');
  const accountingAddons = config.addons.filter(a => a.category === 'accounting');
  const storageAddons = config.addons.filter(a => a.category === 'storage');

  const price = (addon: BillingAddon) =>
    config.billingCycle === 'annual' ? Number(addon.price_annual_eur) : Number(addon.price_monthly_eur);

  const planPrice = config.billingCycle === 'annual' ? config.totalAnnual : config.totalMonthly;

  const submitInterest = async () => {
    try {
      await supabase.from('leads_billing').insert({
        email: user?.email || '',
        selected_plan_code: config.selectedPlanCode,
        selected_addons: config.selectedAddons,
        billing_cycle: config.billingCycle,
        estimated_monthly_eur: config.totalMonthly,
        comments: comments || null,
        user_id: user?.id,
      } as any);
      toast.success('¡Te notificaremos cuando esté disponible!');
      setShowComingSoon(false);
    } catch {
      toast.error('Error al enviar');
    }
  };

  const isCurrentPlan = config.currentPlanCode === config.selectedPlanCode;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT - Configurator */}
        <div className="flex-1 lg:w-[65%] space-y-8">
          {/* Section 1: Plan Selection */}
          <Section title="Elige tu plan base">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.plans.filter(p => p.is_active && p.is_visible_pricing).map(plan => {
                const selected = config.selectedPlanCode === plan.code;
                return (
                  <div
                    key={plan.code}
                    onClick={() => config.setSelectedPlanCode(plan.code)}
                    className={`relative border rounded-xl p-5 cursor-pointer transition-all ${
                      selected
                        ? 'border-2 border-[hsl(217,91%,60%)] bg-blue-50/30'
                        : 'border border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {plan.highlight_label && (
                      <span
                        className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: plan.highlight_color_hex || '#3B82F6' }}
                      >
                        {plan.highlight_label}
                      </span>
                    )}
                    <h4 className="font-bold text-slate-900">{plan.name_es}</h4>
                    <p className="text-2xl font-bold text-slate-900 mt-1">€{Number(plan.price_monthly_eur)}<span className="text-sm font-normal text-slate-500">/mes</span></p>
                    {Number(plan.price_annual_eur) > 0 && Number(plan.price_annual_eur) !== Number(plan.price_monthly_eur) && (
                      <p className="text-xs text-slate-400">€{Number(plan.price_annual_eur)}/mes facturado anualmente</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {plan.included_modules.slice(0, 3).map(m => (
                        <span key={m} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{MODULE_LABELS[m] || m}</span>
                      ))}
                      {plan.included_modules.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{plan.included_modules.length - 3} más</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Section 2: Spider */}
          {!config.isModuleIncluded('spider') ? (
            <Section title="IP-SPIDER — Vigilancia de marcas">
              <AddonRadioGroup
                addons={spiderAddons}
                selectedCode={config.selectedAddons.find(a => spiderAddons.some(s => s.code === a.code))?.code}
                onSelect={(code) => {
                  spiderAddons.forEach(s => { if (config.hasAddon(s.code)) config.toggleAddon(s.code); });
                  if (code) config.toggleAddon(code);
                }}
                billingCycle={config.billingCycle}
                detailFn={(a) => `${a.adds_spider_alerts_monthly === -1 ? '∞' : a.adds_spider_alerts_monthly} alertas/mes`}
              />
            </Section>
          ) : (
            <Section title="IP-SPIDER — Vigilancia de marcas">
              <p className="text-sm text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> Incluido en tu plan</p>
            </Section>
          )}

          {/* Section 3: Genius */}
          {!config.isModuleIncluded('genius') ? (
            <Section title="IP-GENIUS — Asistente IA">
              <AddonRadioGroup
                addons={geniusAddons}
                selectedCode={config.selectedAddons.find(a => geniusAddons.some(s => s.code === a.code))?.code}
                onSelect={(code) => {
                  geniusAddons.forEach(s => { if (config.hasAddon(s.code)) config.toggleAddon(s.code); });
                  if (code) config.toggleAddon(code);
                }}
                billingCycle={config.billingCycle}
                detailFn={(a) => `${a.adds_genius_queries_monthly === -1 ? '∞' : a.adds_genius_queries_monthly} consultas/mes`}
              />
            </Section>
          ) : (
            <Section title="IP-GENIUS — Asistente IA">
              <p className="text-sm text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> Incluido en tu plan</p>
            </Section>
          )}

          {/* Section 4: Market */}
          {marketAddon && (
            <Section title="IP-MARKET — Marketplace de agentes">
              {config.isModuleIncluded('market') ? (
                <p className="text-sm text-emerald-600 flex items-center gap-1"><Check className="w-4 h-4" /> Incluido en tu plan</p>
              ) : (
                <div className="flex items-center justify-between border border-slate-200 rounded-xl p-4 bg-white">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{marketAddon.name_es}</p>
                    <p className="text-xs text-slate-500">€{price(marketAddon)}/mes · 8% comisión por transacción</p>
                  </div>
                  <Switch checked={config.hasAddon(marketAddon.code)} onCheckedChange={() => config.toggleAddon(marketAddon.code)} />
                </div>
              )}
            </Section>
          )}

          {/* Section 5: Jurisdictions */}
          <Section title="Cobertura de jurisdicciones" subtitle="¿En qué países necesitas gestionar PI?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jurisdictionPacks.filter(p => p.code !== 'jurisdiction_single').map(pack => (
                <JurisdictionPackCard key={pack.code} pack={pack} selected={config.hasAddon(pack.code)} onToggle={() => config.toggleAddon(pack.code)} billingCycle={config.billingCycle} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Los packs incluyen acceso al directorio de oficinas IP con tasas actualizadas</p>
          </Section>

          {/* Section 6: Accounting */}
          <Section title="Contabilidad">
            <AddonRadioGroup
              addons={accountingAddons}
              selectedCode={config.selectedAddons.find(a => accountingAddons.some(s => s.code === a.code))?.code}
              onSelect={(code) => {
                accountingAddons.forEach(s => { if (config.hasAddon(s.code)) config.toggleAddon(s.code); });
                if (code) config.toggleAddon(code);
              }}
              billingCycle={config.billingCycle}
              detailFn={(a) => a.description_es || ''}
            />
          </Section>

          {/* Section 7: Users */}
          <Section title="Usuarios adicionales">
            <div className="flex items-center gap-4 border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex-1">
                <p className="text-sm text-slate-500">Tu plan incluye {config.selectedPlan?.limit_users === -1 ? '∞' : config.selectedPlan?.limit_users} usuarios base</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="icon"
                  onClick={() => config.setAddonQuantity('users_extra', Math.max(0, (config.selectedAddons.find(a => a.code === 'users_extra')?.quantity || 0) - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{config.selectedAddons.find(a => a.code === 'users_extra')?.quantity || 0}</span>
                <Button
                  variant="outline" size="icon"
                  onClick={() => config.setAddonQuantity('users_extra', (config.selectedAddons.find(a => a.code === 'users_extra')?.quantity || 0) + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-slate-600">×€39/mes</p>
            </div>
          </Section>

          {/* Section 8: Storage */}
          <Section title="Storage adicional">
            <p className="text-xs text-slate-500 mb-2">Tu plan incluye {config.selectedPlan?.limit_storage_gb === -1 ? '∞' : config.selectedPlan?.limit_storage_gb} GB</p>
            <AddonRadioGroup
              addons={storageAddons}
              selectedCode={config.selectedAddons.find(a => storageAddons.some(s => s.code === a.code))?.code}
              onSelect={(code) => {
                storageAddons.forEach(s => { if (config.hasAddon(s.code)) config.toggleAddon(s.code); });
                if (code) config.toggleAddon(code);
              }}
              billingCycle={config.billingCycle}
              detailFn={(a) => `+${a.adds_storage_gb} GB`}
            />
          </Section>
        </div>

        {/* RIGHT - Summary */}
        <div className="lg:w-[35%]">
          <div className="lg:sticky lg:top-6">
            <div className="border border-slate-200 rounded-xl bg-white p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Tu plan</h3>

              {config.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="font-medium">
                    €{config.billingCycle === 'annual' ? item.annualPrice : item.monthlyPrice}
                  </span>
                </div>
              ))}

              <Separator />

              {/* Cycle toggle */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => config.setBillingCycle('monthly')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${config.billingCycle === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => config.setBillingCycle('annual')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${config.billingCycle === 'annual' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Anual −20%
                </button>
              </div>

              {config.billingCycle === 'annual' && config.annualSavings > 0 && (
                <p className="text-xs text-emerald-600 font-medium text-center">
                  Ahorro total: €{config.annualSavings.toLocaleString('es-ES')}/año
                </p>
              )}

              <Separator />

              <div>
                <p className="text-xs text-slate-500">
                  {config.billingCycle === 'annual' ? 'TOTAL MENSUAL (facturado anualmente)' : 'TOTAL MENSUAL'}
                </p>
                <p className="text-3xl font-bold text-slate-900">€{planPrice}<span className="text-sm font-normal text-slate-500">/mes</span></p>
                {config.billingCycle === 'annual' && (
                  <p className="text-xs text-slate-400">Pago único: €{(planPrice * 12).toLocaleString('es-ES')}/año</p>
                )}
              </div>

              <Button
                className="w-full"
                style={{ backgroundColor: isCurrentPlan ? undefined : '#3B82F6' }}
                disabled={isCurrentPlan}
                onClick={() => setShowComingSoon(true)}
              >
                {isCurrentPlan ? 'Plan actual' : config.currentPlanCode ? 'Cambiar a este plan →' : 'Contratar este plan →'}
              </Button>

              <div className="space-y-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Sin permanencia mínima</p>
                <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Cancela cuando quieras</p>
                <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Soporte incluido en todos los planes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(217,91%,60%)]/10 flex items-center justify-center mb-3">
              <Rocket className="w-6 h-6 text-[hsl(217,91%,60%)]" />
            </div>
            <DialogTitle className="text-center">Próximamente</DialogTitle>
            <DialogDescription className="text-center">
              Estamos preparando el sistema de pagos. Déjanos tu email y te notificaremos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Email</Label><Input value={user?.email || ''} readOnly /></div>
            <div><Label>¿Algún comentario adicional?</Label><Textarea value={comments} onChange={e => setComments(e.target.value)} /></div>
            <Button className="w-full" onClick={submitInterest}>Notificarme cuando esté disponible</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper components ──

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mb-3">{subtitle}</p>}
      {!subtitle && <div className="h-3" />}
      {children}
    </div>
  );
}

function AddonRadioGroup({
  addons,
  selectedCode,
  onSelect,
  billingCycle,
  detailFn,
}: {
  addons: BillingAddon[];
  selectedCode?: string;
  onSelect: (code: string | null) => void;
  billingCycle: 'monthly' | 'annual';
  detailFn: (a: BillingAddon) => string;
}) {
  return (
    <div className="space-y-2">
      {addons.map(a => {
        const selected = selectedCode === a.code;
        const p = billingCycle === 'annual' ? Number(a.price_annual_eur) : Number(a.price_monthly_eur);
        return (
          <div
            key={a.code}
            onClick={() => onSelect(selected ? null : a.code)}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              selected ? 'border-2 border-[hsl(217,91%,60%)] bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-slate-900">{a.name_es}</p>
                <p className="text-xs text-slate-500">{detailFn(a)}</p>
              </div>
              <p className="font-bold text-slate-900">€{p}/mes</p>
            </div>
          </div>
        );
      })}
      <div
        onClick={() => onSelect(null)}
        className={`border rounded-xl p-4 cursor-pointer transition-all ${
          !selectedCode ? 'border-2 border-slate-300 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <p className="text-sm text-slate-500">No incluir</p>
      </div>
    </div>
  );
}

function JurisdictionPackCard({
  pack,
  selected,
  onToggle,
  billingCycle,
}: {
  pack: BillingAddon;
  selected: boolean;
  onToggle: () => void;
  billingCycle: 'monthly' | 'annual';
}) {
  const [expanded, setExpanded] = useState(false);
  const p = billingCycle === 'annual' ? Number(pack.price_annual_eur) : Number(pack.price_monthly_eur);

  return (
    <div
      className={`border rounded-xl p-4 transition-all ${
        selected ? 'border-2 border-[hsl(217,91%,60%)] bg-blue-50/30' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm text-slate-900">{pack.name_es}</h4>
          <p className="text-xs text-slate-500">{pack.jurisdiction_codes?.length || 0} países · €{p}/mes</p>
        </div>
        <Switch checked={selected} onCheckedChange={onToggle} />
      </div>
      {pack.jurisdiction_codes && pack.jurisdiction_codes.length > 0 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-[hsl(217,91%,60%)] mt-2 flex items-center gap-1">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Ocultar países' : 'Ver países'}
        </button>
      )}
      {expanded && (
        <div className="flex flex-wrap gap-1 mt-2">
          {pack.jurisdiction_codes?.map(c => (
            <span key={c} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}
