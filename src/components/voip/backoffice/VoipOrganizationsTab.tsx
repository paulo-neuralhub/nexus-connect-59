import { useMemo } from 'react';
import { ProfessionalCard, CardHeader } from '@/components/ui/professional-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BackofficeVoipOrgSummary } from '@/types/voip';
import { formatEur } from './format';

export function VoipOrganizationsTab({
  organizations,
  isLoading,
}: {
  organizations: BackofficeVoipOrgSummary[];
  isLoading: boolean;
}) {
  const totals = useMemo(() => {
    return {
      calls: organizations.reduce((sum, o) => sum + (o.month_total_calls ?? 0), 0),
      minutes: organizations.reduce((sum, o) => sum + (o.month_total_minutes ?? 0), 0),
      cost: organizations.reduce((sum, o) => sum + (o.month_total_cost_cents ?? 0), 0),
      revenue: organizations.reduce((sum, o) => sum + (o.month_total_price_cents ?? 0), 0),
      margin: organizations.reduce((sum, o) => sum + (o.month_margin_cents ?? 0), 0),
    };
  }, [organizations]);

  return (
    <ProfessionalCard>
      <CardHeader title="Detalle por organización" subtitle="Resumen del periodo actual" />
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organización</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Llamadas</TableHead>
              <TableHead className="text-right">Minutos</TableHead>
              <TableHead className="text-right">Coste</TableHead>
              <TableHead className="text-right">Ingreso</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Aún no hay datos de VoIP.
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => {
                const marginPct =
                  (org.month_total_price_cents ?? 0) > 0
                    ? ((org.month_margin_cents / org.month_total_price_cents) * 100).toFixed(1)
                    : '0.0';
                return (
                  <TableRow key={org.organization_id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{org.organization_name}</div>
                      <div className="text-xs text-muted-foreground">{org.twilio_phone_number ?? '—'}</div>
                    </TableCell>
                    <TableCell>{org.plan_name ?? '—'}</TableCell>
                    <TableCell className="text-right">{org.month_total_calls}</TableCell>
                    <TableCell className="text-right">{org.month_total_minutes}</TableCell>
                    <TableCell className="text-right">{formatEur(org.month_total_cost_cents)}</TableCell>
                    <TableCell className="text-right">{formatEur(org.month_total_price_cents)}</TableCell>
                    <TableCell className="text-right">{formatEur(org.month_margin_cents)}</TableCell>
                    <TableCell className="text-right">{marginPct}%</TableCell>
                  </TableRow>
                );
              })
            )}

            {!isLoading && organizations.length > 0 && (
              <TableRow>
                <TableCell className="font-semibold">TOTAL</TableCell>
                <TableCell />
                <TableCell className="text-right font-semibold">{totals.calls}</TableCell>
                <TableCell className="text-right font-semibold">{totals.minutes}</TableCell>
                <TableCell className="text-right font-semibold">{formatEur(totals.cost)}</TableCell>
                <TableCell className="text-right font-semibold">{formatEur(totals.revenue)}</TableCell>
                <TableCell className="text-right font-semibold">{formatEur(totals.margin)}</TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ProfessionalCard>
  );
}
