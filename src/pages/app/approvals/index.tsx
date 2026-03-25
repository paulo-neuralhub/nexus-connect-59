// ============================================================
// IP-NEXUS — Approvals Page
// ============================================================

import { useState } from 'react';
import { usePageTitle } from '@/contexts/page-context';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import {
  usePendingApprovalsList,
  useApprovalsCount,
  useApproveItem,
  useRejectItem,
  type PendingApproval,
} from '@/hooks/use-approvals';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, X, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function urgencyColor(level: string | null) {
  switch (level) {
    case 'critical': return 'border-l-red-500';
    case 'urgent': return 'border-l-orange-500';
    default: return 'border-l-blue-500';
  }
}

function urgencyLabel(level: string | null) {
  switch (level) {
    case 'critical': return { text: '🚨 CRÍTICO', cls: 'bg-red-100 text-red-700' };
    case 'urgent': return { text: '⚠️ URGENTE', cls: 'bg-orange-100 text-orange-700' };
    default: return { text: '📋 NORMAL', cls: 'bg-blue-100 text-blue-700' };
  }
}

function ExpirationTimer({ expiresAt }: { expiresAt: string }) {
  const mins = differenceInMinutes(new Date(expiresAt), new Date());
  if (mins > 240) return null; // Only show if < 4 hours
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  const isUrgent = mins < 60;
  return (
    <div className={cn('flex items-center gap-1 text-xs', isUrgent ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>
      <Clock className="h-3 w-3" />
      ⏱️ Expira en {hours > 0 ? `${hours}h ` : ''}{remainder}m
    </div>
  );
}

function ApprovalCard({
  approval,
  onApprove,
  onReject,
}: {
  approval: PendingApproval;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const urg = urgencyLabel(approval.urgency_level);
  const timeAgo = approval.created_at
    ? formatDistanceToNow(new Date(approval.created_at), { addSuffix: false, locale: es })
    : '';

  return (
    <div className={cn(
      'rounded-lg border border-l-4 bg-card p-4 space-y-3 transition-all',
      urgencyColor(approval.urgency_level)
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={cn('text-[10px] border-0', urg.cls)}>{urg.text}</Badge>
        <Badge variant="outline" className="text-[10px]">{approval.source_type}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Title + Account */}
      <div>
        <h3 className="font-semibold text-sm">{approval.title}</h3>
        {approval.account?.name && (
          <p className="text-xs text-muted-foreground mt-0.5">{approval.account.name}</p>
        )}
        {approval.matter?.reference_number && (
          <p className="text-xs text-muted-foreground">Exp: {approval.matter.reference_number}</p>
        )}
      </div>

      {/* Summary */}
      {approval.summary && (
        <p className="text-sm text-muted-foreground line-clamp-2">{approval.summary}</p>
      )}

      {/* AI analysis */}
      {approval.ai_analysis && (
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">IP-GENIUS preparó:</p>
          <p className="text-muted-foreground">{approval.ai_analysis}</p>
        </div>
      )}

      {/* Confidence bar */}
      {approval.ai_confidence != null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confianza:</span>
          <div className="flex-1 h-2 bg-muted rounded-full max-w-[200px]">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.round(approval.ai_confidence * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium">{Math.round(approval.ai_confidence * 100)}%</span>
        </div>
      )}

      {/* Expiration */}
      {approval.expires_at && <ExpirationTimer expiresAt={approval.expires_at} />}

      {/* Expand + Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          {expanded ? 'Ocultar' : 'Ver detalle'}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="text-xs text-red-600" onClick={() => onReject(approval.id)}>
            <X className="h-3 w-3 mr-1" /> Rechazar
          </Button>
          <Button size="sm" className="text-xs" onClick={() => onApprove(approval.id)}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Aprobar
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-2 pt-3 border-t text-sm space-y-2 text-muted-foreground">
          {approval.proposed_action && <p><strong>Acción propuesta:</strong> {approval.proposed_action}</p>}
          {approval.proposed_data && (
            <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
              {JSON.stringify(approval.proposed_data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  usePageTitle('Aprobaciones');
  const { session } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user?.id;

  const [urgencyFilter, setUrgencyFilter] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: approvals = [], isLoading } = usePendingApprovalsList(urgencyFilter);
  const { data: countsData } = useApprovalsCount();
  const approveItem = useApproveItem();
  const rejectItem = useRejectItem();

  const handleApprove = (id: string) => {
    if (!userId) return;
    approveItem.mutate({ approvalId: id, userId }, {
      onSuccess: (data: any) => {
        const approval = approvals.find(a => a.id === id);
        if (approval?.source_type === 'ai_instruction') {
          navigate('/app/instructions');
        }
      },
    });
  };

  const handleReject = () => {
    if (!rejectId || !userId) return;
    rejectItem.mutate({ approvalId: rejectId, userId, reason: rejectReason }, {
      onSuccess: () => {
        setRejectId(null);
        setRejectReason('');
      },
    });
  };

  const filters = [
    { key: null, label: 'Todos' },
    { key: 'critical', label: '🚨 Críticos' },
    { key: 'urgent', label: '⚠️ Urgentes' },
    { key: 'normal', label: 'Normal' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Pendiente de aprobación</h1>
        <p className="text-sm text-muted-foreground">
          {countsData?.total || 0} items requieren tu decisión
        </p>
        {(countsData?.critical || 0) > 0 && (
          <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">{countsData?.critical} items críticos</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {filters.map(f => (
          <Button
            key={f.key ?? 'all'}
            variant={urgencyFilter === f.key ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => setUrgencyFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-green-100 dark:bg-green-950/30 p-4 mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Todo aprobado</h3>
          <p className="text-sm text-muted-foreground">No hay items pendientes de revisión.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map(a => (
            <ApprovalCard
              key={a.id}
              approval={a}
              onApprove={handleApprove}
              onReject={id => setRejectId(id)}
            />
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectId} onOpenChange={v => !v && setRejectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar aprobación</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Motivo del rechazo (opcional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectItem.isPending}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
