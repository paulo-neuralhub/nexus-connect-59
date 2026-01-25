// ============================================================
// IP-NEXUS - Subscription Invoices Page
// ============================================================

import { useState } from 'react';
import { FileText, Download, ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useSubscriptionInvoices } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function SubscriptionInvoicesPage() {
  const { data: invoices = [], isLoading } = useSubscriptionInvoices();
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get unique years from invoices
  const years = [...new Set(invoices.map((inv) => new Date(inv.created_at).getFullYear()))].sort((a, b) => b - a);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const year = new Date(inv.created_at).getFullYear();
    if (yearFilter !== 'all' && year !== parseInt(yearFilter)) return false;
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    return true;
  });

  // Group by year
  const groupedInvoices = filteredInvoices.reduce((acc, inv) => {
    const year = new Date(inv.created_at).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(inv);
    return acc;
  }, {} as Record<number, typeof invoices>);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-primary/10 text-primary">Pagada</Badge>;
      case 'open':
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">Pendiente</Badge>;
      case 'void':
        return <Badge className="bg-destructive/10 text-destructive">Anulada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/settings/subscription">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Historial de Facturas</h1>
          <p className="text-muted-foreground">Todas tus facturas de suscripción</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagadas</SelectItem>
            <SelectItem value="open">Pendientes</SelectItem>
            <SelectItem value="void">Anuladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices by Year */}
      {Object.keys(groupedInvoices).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay facturas disponibles</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedInvoices)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, yearInvoices]) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle className="text-lg">{year}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {yearInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {invoice.invoice_number || 'Sin número'}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {format(new Date(invoice.created_at), "MMMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {formatCurrency((invoice.total_cents || 0) / 100, invoice.currency)}
                      </span>
                      {getStatusBadge(invoice.status)}
                      <div className="flex gap-1">
                        {invoice.hosted_invoice_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                          >
                            Ver detalle
                          </Button>
                        )}
                        {invoice.invoice_pdf_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(invoice.invoice_pdf_url!, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
      )}

      {/* Billing Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de Facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Para modificar tus datos de facturación, accede al portal de cliente.</p>
          </div>
          <Button variant="outline" className="mt-4">
            Editar datos de facturación
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
