import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { ProfessionalCard, CardHeader } from '@/components/ui/professional-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBackofficeVoipPlans, useUpsertBackofficeVoipPlan } from '@/hooks/useBackofficeVoipPlans';
import { useSeedVoipPlans } from '@/hooks/useSeedVoipPlans';
import type { BackofficeVoipPlan } from '@/hooks/useBackofficeVoipPlans';
import { formatEur } from './format';
import { VoipPlanEditorDialog } from './VoipPlanEditorDialog';

export function VoipPlansTab() {
  const { data, isLoading } = useBackofficeVoipPlans();
  const seed = useSeedVoipPlans();
  const upsert = useUpsertBackofficeVoipPlan();

  const [q, setQ] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<BackofficeVoipPlan | null>(null);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((p) => (p.name ?? '').toLowerCase().includes(s) || (p.code ?? '').toLowerCase().includes(s));
  }, [data, q]);

  return (
    <ProfessionalCard>
      <CardHeader
        title="Planes"
        subtitle="CRUD completo de planes (pricing + límites)"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => seed.mutate()}
              disabled={seed.isPending}
            >
              <RefreshCw className="h-4 w-4" />
              Seed
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setActivePlan(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="max-w-sm"
        />
        <div className="text-xs text-muted-foreground">{filtered.length} planes</div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Mensual</TableHead>
              <TableHead className="text-right">Incl.</TableHead>
              <TableHead className="text-right">€/min</TableHead>
              <TableHead className="text-right">Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No hay planes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.code}
                      {p.is_default ? ' · default' : ''}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{String(p.plan_type).split('_').join(' ')}</TableCell>
                  <TableCell className="text-right">{formatEur(p.monthly_price_cents)}</TableCell>
                  <TableCell className="text-right">{p.included_minutes ?? '—'}</TableCell>
                  <TableCell className="text-right">{formatEur(p.price_per_minute_cents)}</TableCell>
                  <TableCell className="text-right">{p.is_active ? 'Sí' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActivePlan(p);
                        setEditorOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VoipPlanEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        plan={activePlan}
        isSaving={upsert.isPending}
        onSave={(payload) => upsert.mutate(payload)}
      />
    </ProfessionalCard>
  );
}
