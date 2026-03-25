// ============================================================
// IP-NEXUS — Matter Detail Panel (right panel for grouped view)
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, Clock, Briefcase, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fromTable } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { MatterGroup } from '@/hooks/use-inbox-grouped';
import type { InboxMessage } from '@/hooks/use-inbox';

// ── Matter type badge ──
function MatterTypeBadgeLg({ type }: { type?: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    trademark: { label: 'TM', bg: '#EDE9FE', color: '#6D28D9' },
    patent: { label: 'PAT', bg: '#DBEAFE', color: '#1D4ED8' },
    design: { label: 'DIS', bg: '#DCFCE7', color: '#15803D' },
  };
  const c = config[type || ''] || { label: type?.toUpperCase()?.slice(0, 3) || '?', bg: '#F1F5F9', color: '#64748B' };
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded"
      style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function useMatterDeadlines(matterId: string | null) {
  return useQuery({
    queryKey: ['matter-deadlines-inbox', matterId],
    queryFn: async () => {
      if (!matterId) return [];
      const { data, error } = await fromTable('matter_deadlines')
        .select('id, title, deadline_date, status, priority')
        .eq('matter_id', matterId)
        .eq('status', 'pending')
        .order('deadline_date', { ascending: true })
        .limit(3) as any;
      if (error) return [];
      return data || [];
    },
    enabled: !!matterId,
    staleTime: 60_000,
  });
}

interface MatterDetailPanelProps {
  group: MatterGroup;
  selectedMsg: InboxMessage | null;
}

export function MatterDetailPanel({ group, selectedMsg }: MatterDetailPanelProps) {
  const navigate = useNavigate();
  const { data: deadlines = [] } = useMatterDeadlines(group.matterId);
  const matter = group.matter;

  if (!matter) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        Sin expediente vinculado
      </div>
    );
  }

  const senderName = selectedMsg?.sender_name || selectedMsg?.account?.name || group.senders[0] || '';
  const senderEmail = selectedMsg?.sender_email || '';
  const initials = senderName.substring(0, 2).toUpperCase();

  return (
    <div className="p-2 space-y-2">
      {/* Matter card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 flex-wrap">
          <MatterTypeBadgeLg type={matter.type} />
          <span className="text-sm font-bold text-[#0a2540]">{matter.reference}</span>
          {matter.jurisdiction_code && (
            <span className="text-xs text-muted-foreground">· {matter.jurisdiction_code}</span>
          )}
        </div>
        <p className="text-sm font-medium text-foreground">{matter.title}</p>
        {matter.status && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {matter.status}
          </Badge>
        )}
        <Button variant="link" size="sm" className="text-xs p-0 h-auto"
          onClick={() => navigate(`/app/expedientes/${matter.id}`)}>
          Ver expediente completo <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Client card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</h4>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{senderName}</p>
            {senderEmail && <p className="text-xs text-muted-foreground truncate">{senderEmail}</p>}
          </div>
        </div>
      </div>

      {/* Deadlines card */}
      {deadlines.length > 0 && (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Plazos próximos
          </h4>
          {(deadlines as any[]).map((d: any) => {
            const isPast = d.deadline_date && new Date(d.deadline_date) < new Date();
            return (
              <div key={d.id} className="rounded-md border p-2 flex items-start gap-2">
                <AlertTriangle className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0',
                  d.priority === 'critical' || isPast ? 'text-destructive' :
                  d.priority === 'high' ? 'text-orange-500' : 'text-amber-500'
                )} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{d.title}</p>
                  <p className={cn('text-[11px]', isPast ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                    {d.deadline_date
                      ? format(new Date(d.deadline_date), "d MMM yyyy", { locale: es })
                      : 'Sin fecha'}
                  </p>
                </div>
                {(d.priority === 'critical' || d.priority === 'high') && (
                  <Badge className={cn(
                    'text-[9px] border-0 px-1.5 py-0',
                    d.priority === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-orange-100 text-orange-700'
                  )}>
                    {d.priority === 'critical' ? 'Fatal' : 'Alto'}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
