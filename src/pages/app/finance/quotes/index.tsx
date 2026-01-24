// ============================================
// src/pages/app/finance/quotes/index.tsx
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Quote {
  id: string;
  reference: string;
  client_name: string;
  title: string;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string;
  created_at: string;
}

// Mock data
const mockQuotes: Quote[] = [
  {
    id: '1',
    reference: 'PRES-2026-001',
    client_name: 'TechCorp S.L.',
    title: 'Registro marca Europa',
    total: 2500,
    currency: 'EUR',
    status: 'sent',
    valid_until: '2026-02-15',
    created_at: '2026-01-10',
  },
  {
    id: '2',
    reference: 'PRES-2026-002',
    client_name: 'Innovatech',
    title: 'Renovación portfolio marcas',
    total: 4800,
    currency: 'EUR',
    status: 'accepted',
    valid_until: '2026-02-28',
    created_at: '2026-01-15',
  },
  {
    id: '3',
    reference: 'PRES-2026-003',
    client_name: 'StartupXYZ',
    title: 'Vigilancia marca 12 meses',
    total: 1200,
    currency: 'EUR',
    status: 'draft',
    valid_until: '2026-03-01',
    created_at: '2026-01-20',
  },
  {
    id: '4',
    reference: 'PRES-2026-004',
    client_name: 'Legal Partners',
    title: 'Oposición marca comunitaria',
    total: 3500,
    currency: 'EUR',
    status: 'rejected',
    valid_until: '2026-01-25',
    created_at: '2026-01-05',
  },
];

const statusConfig: Record<Quote['status'], { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: <FileText className="w-3 h-3" /> },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Send className="w-3 h-3" /> },
  accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
  expired: { label: 'Caducado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <Clock className="w-3 h-3" /> },
};

export default function QuotesPage() {
  usePageTitle('Presupuestos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Quote['status'] | 'all'>('all');

  const filteredQuotes = mockQuotes.filter(quote => {
    const matchesSearch = 
      quote.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockQuotes.length,
    pending: mockQuotes.filter(q => q.status === 'sent').length,
    accepted: mockQuotes.filter(q => q.status === 'accepted').length,
    totalValue: mockQuotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Presupuestos</h1>
          <p className="text-muted-foreground">
            Gestiona presupuestos y propuestas para clientes
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo presupuesto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendientes</div>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Aceptados</div>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Valor aceptado</div>
            <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lista de presupuestos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    {statusFilter === 'all' ? 'Todos' : statusConfig[statusFilter].label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    Todos
                  </DropdownMenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => setStatusFilter(key as Quote['status'])}>
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Válido hasta</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const status = statusConfig[quote.status];
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.reference}</TableCell>
                    <TableCell>{quote.client_name}</TableCell>
                    <TableCell>{quote.title}</TableCell>
                    <TableCell className="font-medium">
                      {quote.total.toLocaleString()} {quote.currency}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} gap-1`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(quote.valid_until), 'dd MMM yyyy', { locale: es })}
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
                          {quote.status === 'draft' && (
                            <DropdownMenuItem>
                              <Send className="w-4 h-4 mr-2" />
                              Enviar
                            </DropdownMenuItem>
                          )}
                          {quote.status === 'accepted' && (
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Crear factura
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredQuotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron presupuestos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
