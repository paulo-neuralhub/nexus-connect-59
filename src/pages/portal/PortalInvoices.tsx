/**
 * Portal Invoices
 * Lista de facturas del cliente
 */

import { useState, useMemo } from 'react';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { usePortalInvoices } from '@/hooks/use-portal-invoices';
import { usePaymentLinkByInvoice, useCreatePaymentLink } from '@/hooks/use-invoice-payment-links';
import { formatCurrency, INVOICE_STATUSES } from '@/lib/constants/finance';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Receipt, 
  Download,
  Eye,
  Filter,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function PortalInvoices() {
  const { user } = usePortalAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const invoicesQuery = usePortalInvoices(statusFilter === 'all' ? undefined : statusFilter);
  const invoices = invoicesQuery.data ?? [];

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      return (
        !search ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (inv.client_name || '').toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [invoices, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Pagada
          </Badge>
        );
      case 'sent':
      case 'viewed':
        return (
          <Badge variant="outline" className="text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="text-red-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencida
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: invoices.reduce((sum, inv) => sum + inv.total, 0),
    pending: invoices.filter(i => ['sent', 'viewed'].includes(i.status)).reduce((s, i) => s + (i.total - (i.paid_amount || 0)), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total - (i.paid_amount || 0)), 0),
  }), [invoices]);

  const createPaymentLinkMutation = useCreatePaymentLink();

  const handlePayNow = async (invoiceId: string) => {
    try {
      const result = await createPaymentLinkMutation.mutateAsync({ invoiceId });
      if (result?.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No se pudo obtener el enlace de pago');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar link de pago';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
        <p className="text-muted-foreground">
          Historial de facturación y pagos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total facturado</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Pendiente de pago</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Vencido</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(stats.overdue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o concepto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="paid">Pagadas</SelectItem>
                <SelectItem value="sent">Pendientes</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Invoices List */}
          <div className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron facturas
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <div 
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                          <p className="font-medium">{inv.invoice_number}</p>
                        {getStatusBadge(inv.status)}
                      </div>
                        <p className="text-sm text-muted-foreground truncate">{inv.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                          Fecha: {new Date(inv.invoice_date).toLocaleDateString('es')}
                          {inv.due_date ? ` • Vence: ${new Date(inv.due_date).toLocaleDateString('es')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:ml-auto">
                      <p className="text-lg font-semibold">{formatCurrency(inv.total, inv.currency)}</p>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                      {inv.status !== 'paid' && (
                          <Button size="sm" variant="default" onClick={() => handlePayNow(inv.id)}>
                          <CreditCard className="w-4 h-4 mr-1" />
                          Pagar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
