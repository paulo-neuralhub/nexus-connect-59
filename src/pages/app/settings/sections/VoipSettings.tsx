import { useMemo } from 'react';
import { PhoneCall, Package, Clock, Settings2, Save } from 'lucide-react';
import { ProfessionalCard, CardHeader } from '@/components/ui/professional-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVoipSubscription } from '@/hooks/useVoipSubscription';
import { useVoipPlans } from '@/hooks/useVoipPlans';
import { useVoipUsage } from '@/hooks/useVoipUsage';
import { useUpdateVoipSettings, useVoipSettings } from '@/hooks/useVoipSettings';

function formatEur(cents: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100);
}

export default function VoipSettings() {
  const { data: subscription, isLoading: subLoading } = useVoipSubscription();
  const { data: plans, isLoading: plansLoading } = useVoipPlans();
  const { data: usage, isLoading: usageLoading } = useVoipUsage();
  const { data: settings, isLoading: settingsLoading } = useVoipSettings();
  const update = useUpdateVoipSettings();

  const currentPlan = useMemo(() => {
    return (plans ?? []).find((p) => p.id === subscription?.plan_id) ?? null;
  }, [plans, subscription?.plan_id]);

  const minutesUsed = subscription?.minutes_used ?? 0;
  const minutesIncluded = subscription?.minutes_included ?? currentPlan?.included_minutes ?? 0;
  const minutesRemaining = Math.max(0, (minutesIncluded ?? 0) - minutesUsed);
  const usagePct = minutesIncluded ? Math.min(100, (minutesUsed / minutesIncluded) * 100) : 0;

  return (
    <div className="space-y-6">
      <ProfessionalCard>
        <CardHeader
          title="Telefonía VoIP"
          subtitle="Plan, consumo y configuración de grabación/transcripción"
          icon={<PhoneCall className="h-5 w-5" />}
        />

        {(subLoading || plansLoading) && <div className="text-sm text-muted-foreground">Cargando…</div>}

        {!subLoading && !subscription && (
          <div className="rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
            Tu organización aún no tiene un plan VoIP asignado.
          </div>
        )}

        {subscription && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-4 w-4" /> Plan actual
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">{currentPlan?.name ?? '—'}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {currentPlan?.monthly_price_cents ? `${formatEur(currentPlan.monthly_price_cents)}/mes` : '—'}
              </div>
            </div>

            <div className="rounded-xl border bg-muted p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" /> Consumo del periodo
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">{minutesUsed} min</div>
                  <div className="text-sm text-muted-foreground">Restantes: {minutesRemaining} min</div>
                </div>
                <div className="text-xs text-muted-foreground">{minutesIncluded ? `${minutesUsed}/${minutesIncluded}` : '—'}</div>
              </div>
              {minutesIncluded ? (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-primary" style={{ width: `${usagePct}%` }} />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </ProfessionalCard>

      <ProfessionalCard>
        <CardHeader title="Configuración" subtitle="Se aplica a la organización" icon={<Settings2 className="h-5 w-5" />} />

        {settingsLoading && <div className="text-sm text-muted-foreground">Cargando…</div>}

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <div className="text-sm font-medium text-foreground">Grabar llamadas</div>
              <div className="text-xs text-muted-foreground">Activa la grabación automática (si está soportado por tu configuración Twilio).</div>
            </div>
            <Switch
              checked={settings?.recording_enabled ?? true}
              onCheckedChange={(checked) => update.mutate({ recording_enabled: checked })}
              disabled={update.isPending}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <div className="text-sm font-medium text-foreground">Pedir consentimiento</div>
              <div className="text-xs text-muted-foreground">Reproduce un aviso de grabación (si se integra en tu flujo TwiML).</div>
            </div>
            <Switch
              checked={settings?.recording_consent_required ?? false}
              onCheckedChange={(checked) => update.mutate({ recording_consent_required: checked })}
              disabled={update.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Mensaje de consentimiento</Label>
            <Input
              defaultValue={settings?.recording_consent_message ?? 'Esta llamada será grabada.'}
              onBlur={(e) => update.mutate({ recording_consent_message: e.target.value })}
              disabled={update.isPending}
            />
            <div className="text-xs text-muted-foreground">Se guarda al salir del campo.</div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <div className="text-sm font-medium text-foreground">Transcripción automática</div>
              <div className="text-xs text-muted-foreground">Activa el pipeline de transcripción (si está configurado).</div>
            </div>
            <Switch
              checked={settings?.transcription_enabled ?? true}
              onCheckedChange={(checked) => update.mutate({ transcription_enabled: checked })}
              disabled={update.isPending}
            />
          </div>

          <div className="flex items-center justify-end">
            <Button variant="outline" disabled>
              <Save className="h-4 w-4" />
              Guardado automático
            </Button>
          </div>
        </div>
      </ProfessionalCard>

      <ProfessionalCard>
        <CardHeader title="Historial de uso" subtitle="Últimas llamadas facturables" icon={<Clock className="h-5 w-5" />} />
        {usageLoading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : (usage ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground">Aún no hay registros.</div>
        ) : (
          <div className="space-y-2">
            {(usage ?? []).slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.direction === 'outbound' ? '↗ Saliente' : '↙ Entrante'} · {r.direction === 'outbound' ? r.to_number : r.from_number}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(r.started_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">{r.billable_minutes} min</div>
                  <div className="text-xs text-muted-foreground">{r.total_price_cents ? formatEur(r.total_price_cents) : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfessionalCard>
    </div>
  );
}
