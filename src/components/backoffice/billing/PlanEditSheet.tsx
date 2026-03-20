import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useUpdateBillingPlan, type BillingPlan } from '@/hooks/useBillingData';

const ALL_MODULES = [
  { code: 'docket', label: 'Docket (gestión de expedientes)' },
  { code: 'crm', label: 'CRM' },
  { code: 'finance_basic', label: 'Finanzas básicas' },
  { code: 'finance', label: 'Finanzas completas' },
  { code: 'communications', label: 'Comunicaciones (email + WhatsApp)' },
  { code: 'automations', label: 'Automatizaciones' },
  { code: 'spider', label: 'IP-SPIDER (vigilancia)' },
  { code: 'genius', label: 'IP-GENIUS (IA legal)' },
  { code: 'market', label: 'IP-MARKET (marketplace)' },
  { code: 'filing', label: 'Filing automático' },
  { code: 'analytics', label: 'Analytics avanzados' },
  { code: 'api', label: 'API access' },
  { code: 'sso', label: 'SSO/SAML' },
  { code: 'accounting_basic', label: 'Contabilidad básica' },
  { code: 'accounting_advanced', label: 'Contabilidad avanzada' },
];

const LIMIT_FIELDS = [
  { key: 'limit_matters', label: 'Expedientes', tooltip: 'Máximo de expedientes activos. -1 = ilimitado' },
  { key: 'limit_contacts', label: 'Contactos', tooltip: '' },
  { key: 'limit_users', label: 'Usuarios', tooltip: 'Incluidos en el precio base' },
  { key: 'limit_storage_gb', label: 'Storage (GB)', tooltip: '' },
  { key: 'limit_genius_queries_monthly', label: 'Consultas IP-GENIUS/mes', tooltip: '' },
  { key: 'limit_spider_alerts_monthly', label: 'Alertas IP-SPIDER/mes', tooltip: 'Alertas totales de vigilancia mensuales, no marcas vigiladas' },
  { key: 'limit_jurisdictions_docket', label: 'Jurisdicciones docket', tooltip: 'Oficinas IP activas en el docket' },
];

interface PlanEditSheetProps {
  plan: BillingPlan;
  open: boolean;
  onClose: () => void;
}

export function PlanEditSheet({ plan, open, onClose }: PlanEditSheetProps) {
  const updatePlan = useUpdateBillingPlan();
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    setForm({ ...plan });
  }, [plan]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleModule = (code: string) => {
    const mods: string[] = form.included_modules || [];
    set('included_modules', mods.includes(code) ? mods.filter(m => m !== code) : [...mods, code]);
  };

  const save = () => {
    const { id, created_at, ...updates } = form;
    updatePlan.mutate({ id: plan.id, ...updates }, { onSuccess: onClose });
  };

  const annualSavings = ((Number(form.price_monthly_eur) - Number(form.price_annual_eur)) * 12);
  const savingsPct = Number(form.price_monthly_eur) > 0
    ? Math.round((1 - Number(form.price_annual_eur) / Number(form.price_monthly_eur)) * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar plan: {plan.name_es}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Info */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Información básica</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre (español)</Label>
                <Input value={form.name_es || ''} onChange={e => set('name_es', e.target.value)} />
              </div>
              <div>
                <Label>Nombre (inglés)</Label>
                <Input value={form.name_en || ''} onChange={e => set('name_en', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description_es || ''} onChange={e => set('description_es', e.target.value)} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_visible_pricing ?? true} onCheckedChange={v => set('is_visible_pricing', v)} />
                <Label>Visible en pricing</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active ?? true} onCheckedChange={v => set('is_active', v)} />
                <Label>Activo</Label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Etiqueta destacada</Label>
                <Input value={form.highlight_label || ''} onChange={e => set('highlight_label', e.target.value || null)} placeholder="Ej: Más popular" />
              </div>
              <div>
                <Label>Color hex</Label>
                <Input value={form.highlight_color_hex || ''} onChange={e => set('highlight_color_hex', e.target.value || null)} placeholder="#3B82F6" />
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.sort_order ?? 0} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </section>

          <Separator />

          {/* Prices */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Precios</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Precio mensual (€)</Label>
                <Input type="number" value={form.price_monthly_eur ?? 0} onChange={e => set('price_monthly_eur', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Precio anual/mes (€)</Label>
                <Input type="number" value={form.price_annual_eur ?? 0} onChange={e => set('price_annual_eur', parseFloat(e.target.value) || 0)} />
                <p className="text-[10px] text-slate-400 mt-0.5">Se cobra como pago único anual</p>
              </div>
              <div>
                <Label>Días de trial</Label>
                <Input type="number" value={form.trial_days ?? 0} onChange={e => set('trial_days', parseInt(e.target.value) || 0)} />
              </div>
            </div>
            {annualSavings > 0 && (
              <p className="text-xs text-emerald-600">
                Ahorro anual total: €{annualSavings.toLocaleString('es-ES')}/año ({savingsPct}%)
              </p>
            )}
          </section>

          <Separator />

          {/* Limits */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Límites</h4>
            <div className="space-y-2">
              {LIMIT_FIELDS.map(({ key, label, tooltip }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm">{label}</span>
                    {tooltip && <p className="text-[10px] text-slate-400">{tooltip}</p>}
                  </div>
                  <Input
                    type="number"
                    className="w-28"
                    value={form[key] ?? 0}
                    onChange={e => set(key, parseInt(e.target.value))}
                    placeholder={form[key] === -1 ? '∞ (ilimitado)' : undefined}
                  />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Modules */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Módulos incluidos</h4>
            <div className="grid grid-cols-1 gap-2">
              {ALL_MODULES.map(({ code, label }) => (
                <div key={code} className="flex items-center gap-2">
                  <Checkbox
                    checked={(form.included_modules || []).includes(code)}
                    onCheckedChange={() => toggleModule(code)}
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={updatePlan.isPending}>
            {updatePlan.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
