// =============================================
// Próximos 7 Días — prominent deadline widget
// =============================================

import { Link } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Deadline7d {
  id: string;
  title: string;
  deadlineDate: string;
  deadlineType: string;
  priority: string;
  matterRef?: string;
  matterId?: string;
  clientName?: string;
  jurisdictionCode?: string;
}

interface Proximos7DiasProps {
  deadlines: Deadline7d[];
  isLoading?: boolean;
}

function urgencyDot(dateStr: string) {
  const d = new Date(dateStr);
  if (isPast(d)) return '🔴';
  const days = differenceInDays(d, new Date());
  if (days <= 2) return '🔴';
  if (days <= 4) return '🟠';
  return '🟡';
}

function deadlineTypeBadge(type: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    official: { label: 'Oficial', bg: '#DBEAFE', color: '#1D4ED8' },
    office_action: { label: 'Office Action', bg: '#FEE2E2', color: '#DC2626' },
    renewal: { label: 'Renovación', bg: '#D1FAE5', color: '#059669' },
    opposition: { label: 'Oposición', bg: '#FDE68A', color: '#92400E' },
    internal: { label: 'Interno', bg: '#F1F5F9', color: '#475569' },
  };
  const cfg = map[type] || map.internal;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function jurisdictionFlag(code?: string) {
  if (!code) return null;
  const flagMap: Record<string, string> = {
    ES: '🇪🇸', EU: '🇪🇺', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
    IT: '🇮🇹', PT: '🇵🇹', CN: '🇨🇳', JP: '🇯🇵', KR: '🇰🇷', BR: '🇧🇷',
    MX: '🇲🇽', AR: '🇦🇷', CL: '🇨🇱', CO: '🇨🇴', IN: '🇮🇳', AU: '🇦🇺',
    WO: '🌐', EP: '🇪🇺',
  };
  return <span title={code}>{flagMap[code.toUpperCase()] || '🏳️'}</span>;
}

export function Proximos7Dias({ deadlines, isLoading }: Proximos7DiasProps) {
  // Split overdue vs upcoming
  const overdue = deadlines.filter(d => isPast(new Date(d.deadlineDate)));
  const upcoming = deadlines.filter(d => !isPast(new Date(d.deadlineDate)));
  const sorted = [...overdue, ...upcoming];

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-5" style={{ borderLeftWidth: 4, borderLeftColor: '#B8860B' }}>
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-white shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: '#B8860B', borderColor: '#e2e8f0' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h3 className="text-sm font-bold" style={{ color: '#0a2540' }}>
          ⚡ Próximos 7 Días
        </h3>
        <Link
          to="/app/plazos"
          className="text-[11px] font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#B8860B' }}
        >
          Ver todos →
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 pb-5">
          <div
            className="rounded-lg p-4 text-center"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <span className="text-lg">🎉</span>
            <p className="text-sm font-medium mt-1" style={{ color: '#166534' }}>
              Sin plazos urgentes esta semana
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="px-5 pb-4" style={{ maxHeight: 340 }}>
          <div className="space-y-1.5">
            {sorted.map((dl) => {
              const isOverdue = isPast(new Date(dl.deadlineDate));
              return (
                <Link
                  key={dl.id}
                  to={dl.matterId ? `/app/expedientes/${dl.matterId}` : '/app/plazos'}
                >
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-slate-50"
                    style={isOverdue ? { background: '#FEF2F2' } : {}}
                  >
                    {/* Urgency dot */}
                    <span className="text-sm flex-shrink-0">{urgencyDot(dl.deadlineDate)}</span>

                    {/* Type badge */}
                    {deadlineTypeBadge(dl.deadlineType)}

                    {/* Matter ref */}
                    <span
                      className="text-xs font-mono font-medium truncate"
                      style={{ color: '#374151', maxWidth: 100 }}
                    >
                      {dl.matterRef || '—'}
                    </span>

                    {/* Title */}
                    <span
                      className="text-xs truncate flex-1 min-w-0"
                      style={{ color: '#1F2937' }}
                    >
                      {dl.title}
                    </span>

                    {/* Client */}
                    {dl.clientName && (
                      <span
                        className="text-[10px] truncate hidden lg:block"
                        style={{ color: '#6B7280', maxWidth: 100 }}
                      >
                        {dl.clientName}
                      </span>
                    )}

                    {/* Jurisdiction flag */}
                    {jurisdictionFlag(dl.jurisdictionCode)}

                    {/* Time left */}
                    <span
                      className="text-[11px] font-medium whitespace-nowrap flex-shrink-0"
                      style={{ color: isOverdue ? '#DC2626' : '#6B7280' }}
                    >
                      {isOverdue
                        ? 'Vencido'
                        : `en ${formatDistanceToNow(new Date(dl.deadlineDate), { locale: es })}`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
