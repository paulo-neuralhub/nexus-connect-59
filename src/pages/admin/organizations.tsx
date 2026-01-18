import { useState } from 'react';
import { Building2, Search, Users, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAdminOrganizations } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SUBSCRIPTION_STATUSES } from '@/lib/constants/backoffice';

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState('');
  const { data: organizations = [], isLoading } = useAdminOrganizations({ search });
  
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
          <h1 className="text-2xl font-bold text-foreground">Organizaciones</h1>
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
            </tr>
          </thead>
          <tbody className="divide-y">
            {organizations.map((org: any) => {
              const subscription = Array.isArray(org.subscription) ? org.subscription[0] : org.subscription;
              const plan = subscription?.plan;
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
                    <Badge variant="outline">
                      {plan?.name || 'Free'}
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
    </div>
  );
}
