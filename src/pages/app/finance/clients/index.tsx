// ============================================
// src/pages/app/finance/clients/index.tsx
// Finance > Clientes - Using real data from crm_accounts
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Building2,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';

interface BillingClientWithStats {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  payment_terms: number | null;
  total_invoiced: number;
  total_pending: number;
  invoice_count: number;
}

export default function BillingClientsPage() {
  usePageTitle('Clientes de Facturación');
  const { currentOrganization } = useOrganization();
  const [searchQuery, setSearchQuery] = useState('');

  // Query clients with invoice statistics
  const { data: clients, isLoading } = useQuery({
    queryKey: ['finance-clients', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      // Get all accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('crm_accounts')
        .select('id, name, legal_name, tax_id, email, phone, status, payment_terms')
        .eq('organization_id', currentOrganization.id)
        .order('name');

      if (accountsError) throw accountsError;
      if (!accounts) return [];

      // Get invoice stats for each client
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('billing_client_id, total, status')
        .eq('organization_id', currentOrganization.id);

      if (invoicesError) throw invoicesError;

      // Calculate stats per client
      const statsMap = new Map<string, { total: number; pending: number; count: number }>();
      
      for (const inv of invoices || []) {
        if (!inv.billing_client_id) continue;
        
        const current = statsMap.get(inv.billing_client_id) || { total: 0, pending: 0, count: 0 };
        current.total += Number(inv.total) || 0;
        current.count += 1;
        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
          current.pending += Number(inv.total) || 0;
        }
        statsMap.set(inv.billing_client_id, current);
      }

      // Merge accounts with stats
      const result: BillingClientWithStats[] = accounts.map(acc => {
        const stats = statsMap.get(acc.id) || { total: 0, pending: 0, count: 0 };
        return {
          ...acc,
          total_invoiced: stats.total,
          total_pending: stats.pending,
          invoice_count: stats.count,
        };
      });

      return result;
    },
    enabled: !!currentOrganization?.id,
  });

  const filteredClients = (clients || []).filter(client =>
    (client.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.legal_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.tax_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: clients?.length || 0,
    active: clients?.filter(c => c.status === 'active').length || 0,
    withPending: clients?.filter(c => c.total_pending > 0).length || 0,
    totalPending: clients?.reduce((sum, c) => sum + c.total_pending, 0) || 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes de Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona datos de facturación y visualiza estadísticas de clientes
          </p>
        </div>
        <Button asChild>
          <Link to="/app/crm/accounts/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo cliente
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total clientes</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Activos</div>
            <div className="text-2xl font-bold text-primary">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Con pendiente</div>
            <div className="text-2xl font-bold text-destructive">{stats.withPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendiente cobro</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lista de clientes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o CIF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay clientes registrados</p>
              <p className="text-sm mt-1">Los clientes aparecerán aquí cuando tengan facturas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CIF/NIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Plazo pago</TableHead>
                  <TableHead className="text-right">Total facturado</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead>Facturas</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link 
                        to={`/app/crm/accounts/${client.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(client.name || '??').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium group-hover:text-primary group-hover:underline">
                            {client.name}
                          </div>
                          {client.legal_name && client.legal_name !== client.name && (
                            <div className="text-xs text-muted-foreground">{client.legal_name}</div>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{client.tax_id || '—'}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </div>
                        )}
                        {!client.email && !client.phone && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.payment_terms ? `${client.payment_terms} días` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(client.total_invoiced)}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.total_pending > 0 ? (
                        <span className="text-destructive font-medium">
                          {formatCurrency(client.total_pending)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0 €</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client.invoice_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/app/crm/accounts/${client.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver ficha
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/app/finance/invoices?client=${client.id}`}>
                              <FileText className="w-4 h-4 mr-2" />
                              Ver facturas
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/app/crm/accounts/${client.id}`}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Abrir en CRM
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
