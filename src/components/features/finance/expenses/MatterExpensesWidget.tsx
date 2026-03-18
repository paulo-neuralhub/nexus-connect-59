/**
 * Matter Expenses Widget
 * Displays expenses for a specific matter
 * L62-D: Finance Module
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Plus, FileText } from 'lucide-react';
import { useExpenses, useExpenseSummary, Expense, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '@/hooks/finance/useExpenses';
import { ExpenseDialog } from './ExpenseDialog';
import { cn } from '@/lib/utils';

interface MatterExpensesWidgetProps {
  matterId: string;
  matterReference: string;
  matterTitle: string;
}

export function MatterExpensesWidget({
  matterId,
  matterReference,
  matterTitle,
}: MatterExpensesWidgetProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: expenses = [], isLoading } = useExpenses({ matterId });
  const { data: summary } = useExpenseSummary(matterId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Gastos
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Añadir
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold">{formatCurrency(summary?.total || 0)}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-700">{formatCurrency(summary?.billable || 0)}</div>
            <div className="text-xs text-green-600">Facturable</div>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <div className="text-lg font-semibold text-amber-700">{formatCurrency(summary?.unbilled || 0)}</div>
            <div className="text-xs text-amber-600">Sin facturar</div>
          </div>
        </div>

        {/* Pending approval */}
        {summary && summary.pending > 0 && (
          <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-2 text-center">
            {summary.pending} gasto(s) pendiente(s) de aprobación
          </div>
        )}

        {/* Quick Invoice Button */}
        {summary && summary.unbilled > 0 && (
          <Button variant="outline" className="w-full" asChild>
            <a href={`/app/finance/invoices/new?matter=${matterId}`}>
              <FileText className="h-4 w-4 mr-2" />
              Facturar gastos ({formatCurrency(summary.unbilled)})
            </a>
          </Button>
        )}

        {/* Expenses List */}
        <div className="border rounded-lg divide-y max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Cargando...</div>
          ) : expenses.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No hay gastos registrados
            </div>
          ) : (
            expenses.slice(0, 8).map((expense) => (
              <div key={expense.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{expense.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(expense.date), 'd MMM', { locale: es })} • {EXPENSE_CATEGORIES[expense.category]?.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(expense.total_amount)}</div>
                  <Badge variant="secondary" className={cn('text-xs', EXPENSE_STATUSES[expense.status]?.color)}>
                    {EXPENSE_STATUSES[expense.status]?.label}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {expenses.length > 8 && (
          <div className="text-center">
            <Button variant="link" size="sm" asChild>
              <a href={`/app/finance/gastos?matter=${matterId}`}>
                Ver todos ({expenses.length} gastos)
              </a>
            </Button>
          </div>
        )}
      </CardContent>

      <ExpenseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultMatter={{ id: matterId, reference: matterReference, title: matterTitle }}
      />
    </Card>
  );
}
