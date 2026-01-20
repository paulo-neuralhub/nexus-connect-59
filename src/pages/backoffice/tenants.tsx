// src/pages/backoffice/tenants.tsx
import { useState } from 'react';
import { Building2, Search, Settings, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAdminOrganizations } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_STATUSES } from '@/lib/constants/backoffice';
import { ChangePlanDialog } from '@/components/backoffice/ChangePlanDialog';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string; currentPlan: string } | null>(null);
  const { data: organizations = [], isLoading, refetch } = useAdminOrganizations({ search });
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="text-muted-foreground">Gestiona todas las organizaciones registradas</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar organizaciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Organización</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Creada</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {organizations.map((org: any) => {
              const subscription = Array.isArray(org.subscription) ? org.subscription[0] : org.subscription;
              const plan = subscription?.plan;
              const currentPlan = org.plan || plan?.code || 'starter';
              const status = subscription?.status || 'active';
              const statusConfig = SUBSCRIPTION_STATUSES[status as keyof typeof SUBSCRIPTION_STATUSES] || SUBSCRIPTION_STATUSES.active;
              
              return (
                <tr key={org.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded" />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline"
                      className={
                        currentPlan === 'enterprise' ? 'border-amber-500 text-amber-600' :
                        currentPlan === 'professional' ? 'border-primary text-primary' :
                        ''
                      }
                    >
                      {plan?.name || currentPlan?.charAt(0).toUpperCase() + currentPlan?.slice(1) || 'Starter'}
                    </Badge>
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
                    {format(new Date(org.created_at), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedOrg({ 
                        id: org.id, 
                        name: org.name, 
                        currentPlan 
                      })}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Cambiar Plan
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {organizations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron organizaciones
          </div>
        )}
      </div>

      {/* Change Plan Dialog */}
      <ChangePlanDialog
        open={!!selectedOrg}
        onOpenChange={(open) => !open && setSelectedOrg(null)}
        organization={selectedOrg}
        onSuccess={() => {
          setSelectedOrg(null);
          refetch();
        }}
      />
    </div>
  );
}
