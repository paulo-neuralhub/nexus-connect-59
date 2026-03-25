// ============================================================
// IP-NEXUS — Dashboard Widget: Pending Approvals
// ============================================================

import { useNavigate } from 'react-router-dom';
import { usePendingApprovalsList, useApprovalsCount } from '@/hooks/use-approvals';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Zap, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PendingApprovalsWidget() {
  const navigate = useNavigate();
  const { data: countsData } = useApprovalsCount();
  const { data: approvals = [] } = usePendingApprovalsList();

  if (!countsData || countsData.total === 0) return null;

  // Most urgent item
  const topItem = approvals[0];
  const urgentCount = approvals.filter(a => a.urgency_level === 'urgent').length;
  const normalCount = approvals.filter(a => !a.urgency_level || a.urgency_level === 'normal').length;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: '#FFF7ED',
        border: '1px solid #FED7AA',
        borderLeft: '4px solid #F97316',
        borderRadius: '12px',
      }}
    >
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-sm">Pendiente de aprobación</h3>
      </div>

      <div className="flex items-center gap-3 text-xs flex-wrap">
        {countsData.critical > 0 && (
          <span className="text-red-600 font-medium">🚨 {countsData.critical} crítico{countsData.critical > 1 ? 's' : ''}</span>
        )}
        {urgentCount > 0 && (
          <span className="text-orange-600 font-medium">⚠️ {urgentCount} urgente{urgentCount > 1 ? 's' : ''}</span>
        )}
        {normalCount > 0 && (
          <span className="text-muted-foreground">📋 {normalCount} normal{normalCount > 1 ? 'es' : ''}</span>
        )}
      </div>

      {topItem && (
        <div className="rounded-lg bg-white/60 p-3 text-sm">
          <p className="font-medium truncate">{topItem.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {topItem.created_at && (
              <span>Hace {formatDistanceToNow(new Date(topItem.created_at), { locale: es })}</span>
            )}
            {topItem.expires_at && (() => {
              const mins = differenceInMinutes(new Date(topItem.expires_at), new Date());
              if (mins <= 0) return <span className="text-red-600">· expirado</span>;
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return <span className="text-orange-600">· expira en {h > 0 ? `${h}h ` : ''}{m}min</span>;
            })()}
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-orange-700 hover:text-orange-800 p-0 h-auto"
        onClick={() => navigate('/app/approvals')}
      >
        Ver todos <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}
