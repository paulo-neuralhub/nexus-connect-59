import { useState } from 'react';
import { CreditCard, Search, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUBSCRIPTION_STATUSES } from '@/lib/constants/backoffice';

export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*),
          organization:organizations(id, name, slug)
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suscripciones</h1>
          <p className="text-muted-foreground">Gestiona las suscripciones de clientes</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(SUBSCRIPTION_STATUSES).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Organización</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ciclo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Precio</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Próxima renovación</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.map((sub: any) => {
              const statusConfig = SUBSCRIPTION_STATUSES[sub.status as keyof typeof SUBSCRIPTION_STATUSES] || SUBSCRIPTION_STATUSES.active;
              const plan = sub.plan;
              const price = sub.billing_cycle === 'monthly' ? plan?.price_monthly : plan?.price_yearly;
              
              return (
                <tr key={sub.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sub.organization?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{sub.organization?.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {plan?.name || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatCurrency(price || 0)}
                    <span className="text-muted-foreground font-normal">
                      /{sub.billing_cycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ 
                        backgroundColor: `${statusConfig.color}20`,
                        color: statusConfig.color
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {sub.current_period_end 
                      ? format(new Date(sub.current_period_end), 'dd/MM/yyyy', { locale: es })
                      : '-'
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {subscriptions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron suscripciones
          </div>
        )}
      </div>
    </div>
  );
}
