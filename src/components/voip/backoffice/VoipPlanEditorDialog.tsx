import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BackofficeVoipPlan } from '@/hooks/useBackofficeVoipPlans';

const planSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  code: z.string().min(2, 'Código requerido'),
  description: z.string().optional().nullable(),
  plan_type: z.enum(['package', 'pay_as_you_go', 'unlimited']),
  included_minutes: z.coerce.number().int().nullable().optional(),
  monthly_price_cents: z.coerce.number().int().min(0),
  price_per_minute_cents: z.coerce.number().int().min(0),
  overage_price_per_minute_cents: z.coerce.number().int().min(0).nullable().optional(),
  cost_per_minute_cents: z.coerce.number().int().min(0),
  max_concurrent_calls: z.coerce.number().int().min(1),
  max_call_duration_minutes: z.coerce.number().int().min(1),
  is_active: z.coerce.boolean(),
  is_default: z.coerce.boolean(),
  display_order: z.coerce.number().int().min(0),
  features_json: z.string().optional().nullable(),
});

type PlanForm = z.infer<typeof planSchema>;

function safeStringify(obj: unknown) {
  try {
    return obj ? JSON.stringify(obj, null, 2) : '';
  } catch {
    return '';
  }
}

export function VoipPlanEditorDialog({
  open,
  onOpenChange,
  plan,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: BackofficeVoipPlan | null;
  onSave: (payload: Partial<BackofficeVoipPlan>) => void;
  isSaving: boolean;
}) {
  const defaults = useMemo<PlanForm>(
    () => ({
      name: plan?.name ?? '',
      code: plan?.code ?? '',
      description: plan?.description ?? '',
      plan_type: (plan?.plan_type as PlanForm['plan_type']) ?? 'package',
      included_minutes: plan?.included_minutes ?? null,
      monthly_price_cents: plan?.monthly_price_cents ?? 0,
      price_per_minute_cents: plan?.price_per_minute_cents ?? 0,
      overage_price_per_minute_cents: plan?.overage_price_per_minute_cents ?? null,
      cost_per_minute_cents: plan?.cost_per_minute_cents ?? 0,
      max_concurrent_calls: plan?.max_concurrent_calls ?? 1,
      max_call_duration_minutes: plan?.max_call_duration_minutes ?? 60,
      is_active: plan?.is_active ?? true,
      is_default: plan?.is_default ?? false,
      display_order: plan?.display_order ?? 0,
      features_json: safeStringify(plan?.features),
    }),
    [plan],
  );

  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [open, defaults, form]);

  const submit = form.handleSubmit((values) => {
    let features: Record<string, unknown> | null = null;
    const raw = (values.features_json ?? '').trim();
    if (raw) {
      try {
        features = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        toast.error('Features JSON inválido');
        return;
      }
    }

    onSave({
      ...(plan?.id ? { id: plan.id } : {}),
      name: values.name,
      code: values.code,
      description: values.description ? values.description : null,
      plan_type: values.plan_type,
      included_minutes: values.included_minutes ?? null,
      monthly_price_cents: values.monthly_price_cents,
      price_per_minute_cents: values.price_per_minute_cents,
      overage_price_per_minute_cents: values.overage_price_per_minute_cents ?? null,
      cost_per_minute_cents: values.cost_per_minute_cents,
      max_concurrent_calls: values.max_concurrent_calls,
      max_call_duration_minutes: values.max_call_duration_minutes,
      is_active: values.is_active,
      is_default: values.is_default,
      display_order: values.display_order,
      features,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar plan' : 'Nuevo plan'}</DialogTitle>
          <DialogDescription>Configura el plan de VoIP y su pricing.</DialogDescription>
        </DialogHeader>

        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="space-y-1">
            <label className="text-sm text-foreground">Nombre</label>
            <Input {...form.register('name')} />
            {form.formState.errors.name?.message && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Código</label>
            <Input {...form.register('code')} />
            {form.formState.errors.code?.message && (
              <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-foreground">Descripción</label>
            <Input {...form.register('description')} />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Tipo</label>
            <Select
              value={form.watch('plan_type')}
              onValueChange={(v) => form.setValue('plan_type', v as PlanForm['plan_type'], { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="package">Paquete</SelectItem>
                <SelectItem value="pay_as_you_go">Pay as you go</SelectItem>
                <SelectItem value="unlimited">Ilimitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Minutos incluidos</label>
            <Input type="number" {...form.register('included_minutes')} />
            <p className="text-xs text-muted-foreground">Nulo para no aplicar.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Precio mensual (céntimos)</label>
            <Input type="number" {...form.register('monthly_price_cents')} />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Precio/min (céntimos)</label>
            <Input type="number" {...form.register('price_per_minute_cents')} />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Overage/min (céntimos)</label>
            <Input type="number" {...form.register('overage_price_per_minute_cents')} />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Coste/min (céntimos)</label>
            <Input type="number" {...form.register('cost_per_minute_cents')} />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Max. llamadas concurrentes</label>
            <Input type="number" {...form.register('max_concurrent_calls')} />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Max. duración (min)</label>
            <Input type="number" {...form.register('max_call_duration_minutes')} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium text-foreground">Activo</div>
              <div className="text-xs text-muted-foreground">Disponible para suscripciones</div>
            </div>
            <Switch checked={form.watch('is_active')} onCheckedChange={(v) => form.setValue('is_active', v)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium text-foreground">Por defecto</div>
              <div className="text-xs text-muted-foreground">Se sugiere en onboarding</div>
            </div>
            <Switch checked={form.watch('is_default')} onCheckedChange={(v) => form.setValue('is_default', v)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-foreground">Orden</label>
            <Input type="number" {...form.register('display_order')} />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-foreground">Features (JSON)</label>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...form.register('features_json')}
              placeholder='{"key": "value"}'
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
