import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';
import { useBillingPlans, type BillingPlan } from '@/hooks/useBillingData';
import { PlanEditSheet } from './PlanEditSheet';

const MODULE_LABELS: Record<string, string> = {
  docket: 'Docket', crm: 'CRM', finance: 'Finanzas', finance_basic: 'Finanzas Básicas',
  communications: 'Comunicaciones', automations: 'Automatizaciones', spider: 'IP-SPIDER',
  genius: 'IP-GENIUS', market: 'IP-MARKET', filing: 'Filing', analytics: 'Analytics',
  api: 'API', sso: 'SSO', accounting_basic: 'Contabilidad', accounting_advanced: 'Contab. Avanzada',
};

const LIMIT_LABELS = [
  { key: 'limit_matters', label: 'Expedientes' },
  { key: 'limit_contacts', label: 'Contactos' },
  { key: 'limit_users', label: 'Usuarios' },
  { key: 'limit_storage_gb', label: 'Storage (GB)' },
  { key: 'limit_genius_queries_monthly', label: 'Genius/mes' },
  { key: 'limit_spider_alerts_monthly', label: 'Spider alertas/mes' },
  { key: 'limit_jurisdictions_docket', label: 'Jurisdicciones' },
];

function formatLimit(v: number) {
  return v === -1 ? '∞' : v.toLocaleString('es-ES');
}

export function PlansBaseTab() {
  const { data: plans = [], isLoading } = useBillingPlans();
  const [editPlan, setEditPlan] = useState<BillingPlan | null>(null);

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {plans.map(plan => (
          <div
            key={plan.id}
            className="relative border border-slate-200 rounded-xl p-5 bg-white"
          >
            {plan.highlight_label && (
              <span
                className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: plan.highlight_color_hex || '#3B82F6' }}
              >
                {plan.highlight_label}
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-slate-900">{plan.name_es}</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditPlan(plan)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-3">
              <span className="text-2xl font-bold text-slate-900">€{Number(plan.price_monthly_eur)}</span>
              <span className="text-slate-500">/mes</span>
              {Number(plan.price_annual_eur) > 0 && Number(plan.price_annual_eur) !== Number(plan.price_monthly_eur) && (
                <p className="text-xs text-slate-400">€{Number(plan.price_annual_eur)}/mes facturado anualmente</p>
              )}
            </div>

            <hr className="my-3 border-slate-100" />

            {/* Modules */}
            <div className="flex flex-wrap gap-1 mb-3">
              {plan.included_modules.map(m => (
                <span key={m} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {MODULE_LABELS[m] || m}
                </span>
              ))}
            </div>

            {/* Limits */}
            <div className="space-y-1 text-xs">
              {LIMIT_LABELS.map(({ key, label }) => (
                <div key={key} className="flex justify-between text-slate-600">
                  <span>{label}</span>
                  <span className="font-medium">{formatLimit((plan as any)[key])}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center gap-2">
              <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                {plan.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
              {!plan.is_visible_pricing && <Badge variant="outline">Oculto</Badge>}
            </div>
          </div>
        ))}
      </div>

      {editPlan && (
        <PlanEditSheet plan={editPlan} open={!!editPlan} onClose={() => setEditPlan(null)} />
      )}
    </>
  );
}
