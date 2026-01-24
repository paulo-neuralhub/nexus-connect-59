// ============================================
// src/pages/app/finance/clients/index.tsx
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Edit,
  FileText,
  Building2,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';

interface BillingClient {
  id: string;
  name: string;
  tax_id: string;
  email: string;
  billing_address: string;
  payment_method: 'bank_transfer' | 'card' | 'direct_debit';
  payment_terms: number;
  outstanding_balance: number;
  total_billed: number;
  status: 'active' | 'overdue' | 'inactive';
}

const mockClients: BillingClient[] = [
  {
    id: '1',
    name: 'TechCorp S.L.',
    tax_id: 'B12345678',
    email: 'facturacion@techcorp.es',
    billing_address: 'Calle Mayor 123, Madrid',
    payment_method: 'bank_transfer',
    payment_terms: 30,
    outstanding_balance: 2500,
    total_billed: 45000,
    status: 'active',
  },
  {
    id: '2',
    name: 'Innovatech Labs',
    tax_id: 'B87654321',
    email: 'billing@innovatech.com',
    billing_address: 'Av. Diagonal 456, Barcelona',
    payment_method: 'direct_debit',
    payment_terms: 15,
    outstanding_balance: 0,
    total_billed: 28000,
    status: 'active',
  },
  {
    id: '3',
    name: 'StartupXYZ',
    tax_id: 'B11223344',
    email: 'admin@startupxyz.io',
    billing_address: 'Plaza España 10, Valencia',
    payment_method: 'card',
    payment_terms: 0,
    outstanding_balance: 1800,
    total_billed: 12000,
    status: 'overdue',
  },
];

const paymentMethodLabels: Record<BillingClient['payment_method'], string> = {
  bank_transfer: 'Transferencia',
  card: 'Tarjeta',
  direct_debit: 'Domiciliación',
};

const statusConfig: Record<BillingClient['status'], { label: string; color: string }> = {
  active: { label: 'Activo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  overdue: { label: 'Con deuda', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export default function BillingClientsPage() {
  usePageTitle('Clientes de Facturación');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.tax_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockClients.length,
    active: mockClients.filter(c => c.status === 'active').length,
    overdue: mockClients.filter(c => c.status === 'overdue').length,
    totalOutstanding: mockClients.reduce((sum, c) => sum + c.outstanding_balance, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes de Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona datos de facturación y condiciones de pago
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo cliente
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
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Con deuda</div>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendiente cobro</div>
            <div className="text-2xl font-bold">{stats.totalOutstanding.toLocaleString()}€</div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CIF/NIF</TableHead>
                <TableHead>Método pago</TableHead>
                <TableHead>Plazo</TableHead>
                <TableHead>Total facturado</TableHead>
                <TableHead>Pendiente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const status = statusConfig[client.status];
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{client.tax_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                        {paymentMethodLabels[client.payment_method]}
                      </div>
                    </TableCell>
                    <TableCell>{client.payment_terms} días</TableCell>
                    <TableCell>{client.total_billed.toLocaleString()}€</TableCell>
                    <TableCell>
                      {client.outstanding_balance > 0 ? (
                        <span className="text-red-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {client.outstanding_balance.toLocaleString()}€
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0€</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Ver facturas
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
