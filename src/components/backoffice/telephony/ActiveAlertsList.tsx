// ============================================================
// IP-NEXUS BACKOFFICE - Active Alerts List Component
// ============================================================

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertTriangle, 
  XCircle, 
  Send,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import type { ActiveAlert } from '@/hooks/backoffice/useTelephonyAlerts';

interface ActiveAlertsListProps {
  alerts: ActiveAlert[];
  isLoading?: boolean;
  onSendReminder: (tenantIds: string[]) => void;
  isSending?: boolean;
}

export function ActiveAlertsList({
  alerts,
  isLoading,
  onSendReminder,
  isSending,
}: ActiveAlertsListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === alerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alerts.map((a) => a.tenantId)));
    }
  };

  const handleSendReminder = () => {
    onSendReminder(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const zeroBalanceAlerts = alerts.filter((a) => a.type === 'zero');
  const lowBalanceAlerts = alerts.filter((a) => a.type === 'low');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
        <p className="text-muted-foreground">No hay alertas activas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Todos los tenants tienen saldo suficiente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === alerts.length}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} seleccionado(s)`
              : 'Seleccionar todos'}
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleSendReminder}
          disabled={selectedIds.size === 0 || isSending}
        >
          {isSending ? (
            <Spinner className="h-4 w-4 mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar recordatorio
        </Button>
      </div>

      {/* Zero balance alerts */}
      {zeroBalanceAlerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Sin saldo ({zeroBalanceAlerts.length})
          </h4>
          <div className="space-y-2">
            {zeroBalanceAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                isSelected={selectedIds.has(alert.tenantId)}
                onToggle={() => toggleSelect(alert.tenantId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low balance alerts */}
      {lowBalanceAlerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-warning flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Saldo bajo ({lowBalanceAlerts.length})
          </h4>
          <div className="space-y-2">
            {lowBalanceAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                isSelected={selectedIds.has(alert.tenantId)}
                onToggle={() => toggleSelect(alert.tenantId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertItem({
  alert,
  isSelected,
  onToggle,
}: {
  alert: ActiveAlert;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const isZero = alert.type === 'zero';
  
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isSelected ? 'bg-primary/5 border-primary' : 'bg-muted/30 border-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={isSelected} onCheckedChange={onToggle} />
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
          isZero ? 'bg-destructive/10' : 'bg-warning/10'
        }`}>
          {isZero ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{alert.tenantName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{alert.balance} min restantes</span>
            {alert.alertSentAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(alert.alertSentAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <Badge variant={isZero ? 'destructive' : 'secondary'}>
        {isZero ? 'Agotado' : 'Bajo'}
      </Badge>
    </div>
  );
}
