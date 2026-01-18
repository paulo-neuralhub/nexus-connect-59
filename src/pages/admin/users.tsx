import { useState } from 'react';
import { Search, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAdminUsers } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading } = useAdminUsers({ search });
  
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
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona todos los usuarios registrados</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios..."
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
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Usuario</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Organizaciones</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.memberships?.length > 0 ? (
                      user.memberships.map((m: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Building2 className="w-3 h-3 mr-1" />
                          {m.organization?.name} ({m.role})
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin organizaciones</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron usuarios
          </div>
        )}
      </div>
    </div>
  );
}
