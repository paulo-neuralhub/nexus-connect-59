// =============================================
// Próximos 7 Días — prominent deadline widget
// SILK v2 Design System
// =============================================

import { Link } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NeoBadgeInline } from '@/components/ui/neo-badge';

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

function urgencyColor(dateStr: string): string {
  const d = new Date(dateStr);
  if (isPast(d)) return '#ef4444';
  const days = differenceInDays(d, new Date());
  if (days <= 2) return '#ef4444';
  if (days <= 4) return '#f59e0b';
  return '#00b4d8';
}

function urgencyDays(dateStr: string): string {
  const d = new Date(dateStr);
  if (isPast(d)) return '!';
  const days = differenceInDays(d, new Date());
  return days.toString();
}

function deadlineTypeBadge(type: string) {
  const map: Record<string, { label: string; color: string }> = {
    official: { label: 'Oficial', color: '#2563eb' },
    office_action: { label: 'Office Action', color: '#ef4444' },
    renewal: { label: 'Renovación', color: '#10b981' },
    opposition: { label: 'Oposición', color: '#f59e0b' },
    internal: { label: 'Interno', color: '#64748b' },
  };
  const cfg = map[type] || map.internal;
  return (
    <span
      className="text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: `${cfg.color}12`, color: cfg.color }}
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
  const overdue = deadlines.filter(d => isPast(new Date(d.deadlineDate)));
  const upcoming = deadlines.filter(d => !isPast(new Date(d.deadlineDate)));
  const sorted = [...overdue, ...upcoming];

  if (isLoading) {
    return (
      <div
        className="rounded-[14px] border p-[18px]"
        style={{ background: '#ffffff', borderColor: 'hsl(var(--border))' }}
      >
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-50 rounded-[12px] animate-pulse mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-[14px] border shadow-sm"
      style={{ background: '#ffffff', borderColor: 'hsl(var(--border))' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] pt-[18px] pb-3">
        <h3
          className="text-[13px] font-bold tracking-[0.15px]"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          ⚡ Próximos 7 Días
        </h3>
        <Link
          to="/app/plazos"
          className="text-[11px] font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#00b4d8' }}
        >
          Ver todos →
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="px-[18px] pb-[18px]">
          <div
            className="rounded-[12px] p-4 text-center"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <span className="text-lg">🎉</span>
            <p className="text-[12px] font-medium mt-1" style={{ color: '#166534' }}>
              Sin plazos urgentes esta semana
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="px-[18px] pb-[18px]" style={{ maxHeight: 340 }}>
          <div className="space-y-2">
            {sorted.map((dl) => {
              const isOverdue = isPast(new Date(dl.deadlineDate));
              const color = urgencyColor(dl.deadlineDate);
              return (
                <Link
                  key={dl.id}
                  to={dl.matterId ? `/app/expedientes/${dl.matterId}` : '/app/plazos'}
                >
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] border transition-all duration-200 hover:border-[rgba(0,180,216,0.15)] cursor-pointer"
                    style={{
                      background: isOverdue ? 'rgba(239, 68, 68, 0.04)' : 'white',
                      borderColor: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Days NeoBadge */}
                    <NeoBadgeInline
                      value={urgencyDays(dl.deadlineDate)}
                      color={color}
                    />

                    {/* Type badge */}
                    {deadlineTypeBadge(dl.deadlineType)}

                    {/* Matter ref */}
                    <span
                      className="text-[10px] font-mono font-medium truncate"
                      style={{ color: 'hsl(var(--foreground))', maxWidth: 90 }}
                    >
                      {dl.matterRef || '—'}
                    </span>

                    {/* Title */}
                    <span
                      className="text-[11px] truncate flex-1 min-w-0"
                      style={{ color: 'hsl(var(--text-primary))' }}
                    >
                      {dl.title}
                    </span>

                    {/* Client */}
                    {dl.clientName && (
                      <span
                        className="text-[9px] truncate hidden lg:block"
                        style={{ color: 'hsl(var(--text-secondary))', maxWidth: 100 }}
                      >
                        {dl.clientName}
                      </span>
                    )}

                    {/* Jurisdiction flag */}
                    {jurisdictionFlag(dl.jurisdictionCode)}

                    {/* Time left */}
                    <span
                      className="text-[10px] font-medium whitespace-nowrap flex-shrink-0"
                      style={{ color: isOverdue ? '#ef4444' : 'hsl(var(--text-tertiary))' }}
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
