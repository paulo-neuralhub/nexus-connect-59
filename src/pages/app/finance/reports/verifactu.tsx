import { useVerifactuRecords, useRetryFailedVerifactu } from '@/hooks/finance/useVerifactu';
import { useFiscalConfig } from '@/hooks/finance/useFiscalConfig';
import { useFinanceFeature } from '@/hooks/finance/useFinanceModuleConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Lock, Shield, AlertTriangle, CheckCircle, Clock, XCircle, Info, RefreshCw } from 'lucide-react';

export default function VerifactuPage() {
  const { enabled, isLoading: featureLoading } = useFinanceFeature('feature_accounting');
  const { data: fiscalConfig } = useFiscalConfig();
  const verifactuEnabled = fiscalConfig?.verifactu_enabled;
  const { data: records, isLoading } = useVerifactuRecords();
  const retryMutation = useRetryFailedVerifactu();

  if (featureLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!enabled) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center"><CardContent className="pt-8 pb-8 space-y-4"><Lock className="w-12 h-12 mx-auto text-muted-foreground" /><h2 className="text-xl font-semibold">Verifactu</h2><p className="text-muted-foreground">Disponible en el plan Advanced.</p></CardContent></Card>
      </div>
    );
  }

  if (!verifactuEnabled) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Verifactu</h1>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="flex items-start gap-4">
              <Info className="w-10 h-10 text-blue-500 flex-shrink-0 mt-1" />
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Sistema de facturación verificada (AEAT)</h2>
                <p className="text-muted-foreground">
                  Verifactu es el nuevo sistema de facturación verificada de la Agencia Tributaria española. 
                  Será <strong>obligatorio para todos los empresarios y profesionales en España a partir de julio 2027</strong>.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="w-4 h-4" />
                    Plazo: julio 2027
                  </div>
                  <p className="mt-1 text-yellow-700 dark:text-yellow-300">Todos los sistemas de facturación deben cumplir con el Reglamento Verifactu (RD 1007/2023).</p>
                </div>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>✓ Generación automática de hash encadenado por factura</li>
                  <li>✓ Envío telemático a la AEAT en tiempo real</li>
                  <li>✓ Registro inmutable de todas las facturas emitidas</li>
                  <li>✓ Código QR verificable en cada factura</li>
                </ul>
                <p className="text-sm text-muted-foreground">IP-NEXUS incluye soporte completo para Verifactu. Actívalo cuando estés listo.</p>
                <Button>Activar Verifactu</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sent = records?.filter(r => r.submission_status === 'accepted').length || 0;
  const pending = records?.filter(r => r.submission_status === 'pending' || r.submission_status === 'sent').length || 0;
  const errors = records?.filter(r => r.submission_status === 'error').length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Verifactu</h1>
          <Badge variant="outline" className="text-xs">Sandbox</Badge>
        </div>
        {errors > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
            Reintentar fallidas ({errors})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><div><p className="text-sm text-muted-foreground">Enviadas ✓</p><p className="text-2xl font-bold">{sent}</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><Clock className="w-5 h-5 text-yellow-500" /><div><p className="text-sm text-muted-foreground">Pendientes ⏳</p><p className="text-2xl font-bold">{pending}</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><XCircle className="w-5 h-5 text-destructive" /><div><p className="text-sm text-muted-foreground">Errores 🔴</p><p className="text-2xl font-bold">{errors}</p></div></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Factura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Respuesta AEAT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(records || []).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.full_number || '—'}</TableCell>
                  <TableCell>{r.record_date}</TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-32">{r.chain_hash?.slice(0, 16) || '—'}…</TableCell>
                  <TableCell>
                    <Badge variant={r.submission_status === 'accepted' ? 'default' : r.submission_status === 'error' ? 'destructive' : 'outline'} className="text-xs">
                      {r.submission_status === 'accepted' ? '✓ Aceptado' : r.submission_status === 'error' ? '✗ Error' : r.submission_status === 'sent' ? '→ Enviado' : '⏳ Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.error_description || (r.aeat_response ? 'OK' : '—')}</TableCell>
                </TableRow>
              ))}
              {(!records || records.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay registros Verifactu. Envía tu primera factura.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
