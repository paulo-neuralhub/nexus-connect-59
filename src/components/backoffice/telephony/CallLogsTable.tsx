// ============================================================
// IP-NEXUS BACKOFFICE - Call Logs Table Component
// ============================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CallLog } from '@/hooks/backoffice/useTelephonyAnalytics';

interface CallLogsTableProps {
  logs: CallLog[];
  isLoading?: boolean;
  showTenant?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function CallLogsTable({
  logs,
  isLoading,
  showTenant = true,
  onLoadMore,
  hasMore,
}: CallLogsTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const getUsageIcon = (type: string) => {
    switch (type) {
      case 'voice_outbound':
        return <PhoneOutgoing className="h-4 w-4 text-primary" />;
      case 'voice_inbound':
        return <PhoneIncoming className="h-4 w-4 text-success" />;
      case 'sms_outbound':
      case 'sms_inbound':
        return <MessageSquare className="h-4 w-4 text-info" />;
      default:
        return <Phone className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-success/10 text-success hover:bg-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Fallida
          </Badge>
        );
      case 'busy':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Ocupado
          </Badge>
        );
      case 'no_answer':
        return (
          <Badge variant="secondary">
            No contestó
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const maskNumber = (number: string) => {
    if (!number || number.length < 8) return number;
    return `${number.slice(0, -4)}****`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No hay registros de llamadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-3 font-medium">Fecha/Hora</th>
              {showTenant && <th className="text-left py-3 font-medium">Tenant</th>}
              <th className="text-left py-3 font-medium">Usuario</th>
              <th className="text-left py-3 font-medium">De → A</th>
              <th className="text-right py-3 font-medium">Duración</th>
              <th className="text-right py-3 font-medium">Coste</th>
              <th className="text-center py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {getUsageIcon(log.usageType)}
                    <div>
                      <p className="font-medium">
                        {format(new Date(log.createdAt), 'dd/MM HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                </td>
                {showTenant && (
                  <td className="py-3 text-muted-foreground">{log.tenantName}</td>
                )}
                <td className="py-3">{log.userName}</td>
                <td className="py-3 font-mono text-xs">
                  <span className="text-muted-foreground">{maskNumber(log.fromNumber)}</span>
                  <span className="mx-1">→</span>
                  <span>{maskNumber(log.toNumber)}</span>
                  {log.countryCode && (
                    <span className="ml-1 text-muted-foreground">({log.countryCode})</span>
                  )}
                </td>
                <td className="py-3 text-right font-mono">{log.durationFormatted}</td>
                <td className="py-3 text-right">{formatCurrency(log.chargedCost)}</td>
                <td className="py-3 text-center">{getStatusBadge(log.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && onLoadMore && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            Cargar más
          </Button>
        </div>
      )}
    </div>
  );
}
