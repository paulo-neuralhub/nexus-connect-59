// ============================================================
// IP-NEXUS - Recent Invoices Component
// ============================================================

import { FileText, Download, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionInvoice } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Props {
  invoices: SubscriptionInvoice[];
  limit?: number;
}

export function RecentInvoices({ invoices, limit = 3 }: Props) {
  const displayInvoices = invoices.slice(0, limit);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pagada
          </Badge>
        );
      case 'open':
      case 'pending':
        return (
          <Badge variant="default" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'void':
      case 'uncollectible':
        return (
          <Badge variant="default" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Anulada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatInvoiceDate = (dateStr: string) => {
    return format(new Date(dateStr), "MMMM yyyy", { locale: es });
  };

  const handleDownload = (invoice: SubscriptionInvoice) => {
    if (invoice.invoice_pdf_url) {
      window.open(invoice.invoice_pdf_url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Últimas Facturas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayInvoices.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No hay facturas disponibles
          </p>
        ) : (
          displayInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium capitalize">
                    {formatInvoiceDate(invoice.created_at)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.invoice_number || 'Sin número'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {formatCurrency((invoice.total_cents || 0) / 100, invoice.currency)}
                </span>
                {getStatusBadge(invoice.status)}
                {invoice.invoice_pdf_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(invoice)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}

        {invoices.length > limit && (
          <Button variant="link" className="w-full" asChild>
            <Link to="/app/settings/subscription/invoices">
              Ver todas las facturas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
