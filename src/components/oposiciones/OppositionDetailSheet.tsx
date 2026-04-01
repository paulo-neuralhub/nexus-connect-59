import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, User, FileText, Scale, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Opposition } from '@/hooks/useOppositions';
import { STATUS_CONFIG, OUTCOME_CONFIG, GROUNDS_CONFIG, getDeadlineUrgency } from './oposiciones-utils';

interface Props {
  opposition: Opposition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OppositionDetailSheet({ opposition, open, onOpenChange }: Props) {
  if (!opposition) return null;
  const o = opposition;
  const statusCfg = STATUS_CONFIG[o.status] || { label: o.status, variant: 'outline' as const };
  const outcomeCfg = o.outcome ? OUTCOME_CONFIG[o.outcome] : null;
  const deadlineUrgency = getDeadlineUrgency(o.response_deadline);

  const typeLabel = o.opposition_type === 'offensive' ? 'Ofensiva' : o.opposition_type === 'defensive' ? 'Defensiva' : 'Coexistencia';
  const typeColor = o.opposition_type === 'offensive' ? 'text-purple-600' : o.opposition_type === 'defensive' ? 'text-orange-600' : 'text-green-600';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{o.title}</SheetTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${typeColor}`}>{typeLabel}</span>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            {outcomeCfg && (
              <Badge style={{ backgroundColor: outcomeCfg.color, color: '#fff' }}>{outcomeCfg.label}</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Parties */}
          <Section title="Partes" icon={User}>
            {o.opponent_name && <Field label="Oponente" value={o.opponent_name} />}
            {o.opponent_representative && <Field label="Representante" value={o.opponent_representative} />}
            {o.opponent_country && <Field label="País" value={o.opponent_country} />}
          </Section>

          {/* Opposed Mark */}
          {o.opposed_mark_name && (
            <Section title="Marca Opuesta" icon={Scale}>
              <Field label="Nombre" value={o.opposed_mark_name} />
              {o.opposed_mark_number && <Field label="Nº Solicitud" value={o.opposed_mark_number} />}
              {o.opposed_mark_jurisdiction && <Field label="Jurisdicción" value={o.opposed_mark_jurisdiction} />}
              {o.opposed_nice_classes?.length ? <Field label="Clases Nice" value={o.opposed_nice_classes.join(', ')} /> : null}
            </Section>
          )}

          {/* Linked Matter */}
          {o.matter_ref && (
            <Section title="Expediente Vinculado" icon={FileText}>
              <Field label="Referencia" value={o.matter_ref} />
              {o.mark_name && <Field label="Marca" value={o.mark_name} />}
            </Section>
          )}

          {/* Grounds */}
          {o.grounds?.length ? (
            <Section title="Fundamentos" icon={Scale}>
              <div className="flex gap-1 flex-wrap">
                {o.grounds.map((g) => {
                  const cfg = GROUNDS_CONFIG[g] || { label: g, color: '#6b7280' };
                  return <Badge key={g} style={{ backgroundColor: cfg.color, color: '#fff' }}>{cfg.label}</Badge>;
                })}
              </div>
              {o.grounds_detail && <p className="text-sm text-muted-foreground mt-2">{o.grounds_detail}</p>}
            </Section>
          ) : null}

          {/* Dates */}
          <Section title="Cronología" icon={Calendar}>
            {o.filing_date && <Field label="Presentación" value={format(new Date(o.filing_date), 'dd MMM yyyy', { locale: es })} />}
            {o.notification_date && <Field label="Notificación" value={format(new Date(o.notification_date), 'dd MMM yyyy', { locale: es })} />}
            {o.response_deadline && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deadline Respuesta</span>
                <span className="text-sm font-semibold" style={{ color: deadlineUrgency.color }}>
                  {format(new Date(o.response_deadline), 'dd MMM yyyy', { locale: es })} ({deadlineUrgency.label})
                </span>
              </div>
            )}
            {o.hearing_date && <Field label="Audiencia" value={format(new Date(o.hearing_date), 'dd MMM yyyy', { locale: es })} />}
            {o.resolution_date && <Field label="Resolución" value={format(new Date(o.resolution_date), 'dd MMM yyyy', { locale: es })} />}
          </Section>

          {/* Coexistence */}
          {o.opposition_type === 'coexistence' && (
            <Section title="Acuerdo" icon={Clock}>
              {o.coexistence_terms && <p className="text-sm">{o.coexistence_terms}</p>}
              {o.coexistence_expiry_date && <Field label="Vigencia" value={format(new Date(o.coexistence_expiry_date), 'dd MMM yyyy', { locale: es })} />}
              {o.coexistence_territory?.length ? <Field label="Territorio" value={o.coexistence_territory.join(', ')} /> : null}
            </Section>
          )}

          {/* Cost */}
          {(o.estimated_cost || o.actual_cost) && (
            <Section title="Costes" icon={MapPin}>
              {o.estimated_cost != null && <Field label="Estimado" value={`${o.estimated_cost} ${o.currency || 'EUR'}`} />}
              {o.actual_cost != null && <Field label="Real" value={`${o.actual_cost} ${o.currency || 'EUR'}`} />}
            </Section>
          )}

          {o.description && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{o.description}</p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="space-y-1 pl-6">{children}</div>
      <Separator className="mt-4" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
