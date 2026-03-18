/**
 * Expenses Page
 * List and manage expenses
 * L62-D: Finance Module
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Receipt,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Car,
  Package,
  Building,
  Send,
  UtensilsCrossed,
  Bed,
  MoreHorizontal as MoreIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useExpenses,
  useDeleteExpense,
  useApproveExpense,
  useRejectExpense,
  Expense,
  ExpenseStatus,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
} from '@/hooks/finance/useExpenses';
import { ExpenseDialog } from '@/components/features/finance/expenses/ExpenseDialog';
import { toast } from 'sonner';

const CategoryIcon = ({ category }: { category: ExpenseCategory }) => {
  const icons: Record<ExpenseCategory, React.ReactNode> = {
    travel: <Car className="h-4 w-4" />,
    materials: <Package className="h-4 w-4" />,
    official_fees: <Building className="h-4 w-4" />,
    courier: <Send className="h-4 w-4" />,
    meals: <UtensilsCrossed className="h-4 w-4" />,
    accommodation: <Bed className="h-4 w-4" />,
    other: <MoreIcon className="h-4 w-4" />,
  };
  return icons[category] || null;
};

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [expenseToReject, setExpenseToReject] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: expenses = [], isLoading } = useExpenses({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  });
  const deleteMutation = useDeleteExpense();
  const approveMutation = useApproveExpense();
  const rejectMutation = useRejectExpense();

  // Calculate summary stats
  const stats = {
    total: expenses.reduce((sum, e) => sum + e.total_amount, 0),
    pending: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.total_amount, 0),
    approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.total_amount, 0),
    unbilled: expenses.filter(e => e.is_billable && e.billing_status !== 'billed').reduce((sum, e) => sum + e.total_amount, 0),
  };

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        expense.description.toLowerCase().includes(searchLower) ||
        expense.matter?.reference?.toLowerCase().includes(searchLower) ||
        expense.user?.full_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteMutation.mutateAsync(expenseToDelete.id);
      toast.success('Gasto eliminado');
      setExpenseToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleApprove = async (expense: Expense) => {
    try {
      await approveMutation.mutateAsync(expense.id);
      toast.success('Gasto aprobado');
    } catch (error) {
      toast.error('Error al aprobar el gasto');
    }
  };

  const handleReject = async () => {
    if (!expenseToReject) return;
    try {
      await rejectMutation.mutateAsync({
        id: expenseToReject.id,
        reason: rejectReason,
      });
      toast.success('Gasto rechazado');
      setRejectDialogOpen(false);
      setExpenseToReject(null);
      setRejectReason('');
    } catch (error) {
      toast.error('Error al rechazar el gasto');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">Gestión de gastos reembolsables</p>
        </div>
        <Button onClick={() => { setSelectedExpense(null); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo gasto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <div className="text-sm text-muted-foreground">Total registrado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</div>
            <div className="text-sm text-muted-foreground">Pendiente aprobación</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.approved)}</div>
            <div className="text-sm text-muted-foreground">Aprobado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.unbilled)}</div>
            <div className="text-sm text-muted-foreground">Sin facturar</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción, expediente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExpenseStatus | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(EXPENSE_STATUSES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ExpenseCategory | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Expediente</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Facturado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No hay gastos registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {format(new Date(expense.date), 'dd/MM/yy', { locale: es })}
                    </TableCell>
                    <TableCell>{expense.user?.full_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={expense.category} />
                        <span className="text-sm">{EXPENSE_CATEGORIES[expense.category]?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell>
                      {expense.matter ? (
                        <span className="text-sm text-primary">{expense.matter.reference}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expense.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-xs', EXPENSE_STATUSES[expense.status]?.color)}>
                        {EXPENSE_STATUSES[expense.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.billing_status === 'billed' ? (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          Facturado
                        </Badge>
                      ) : expense.is_billable ? (
                        <Badge variant="outline" className="text-xs">Pendiente</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No facturable</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {expense.receipt_url && (
                            <DropdownMenuItem asChild>
                              <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver justificante
                              </a>
                            </DropdownMenuItem>
                          )}
                          {expense.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(expense)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setExpenseToReject(expense); setRejectDialogOpen(true); }}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Rechazar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setExpenseToDelete(expense)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                          {expense.status !== 'pending' && (
                            <DropdownMenuItem onClick={() => handleEdit(expense)} disabled>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ExpenseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        expense={selectedExpense}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Indica el motivo del rechazo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Motivo del rechazo..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
