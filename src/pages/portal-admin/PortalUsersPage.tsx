/**
 * Portal Users Admin Page - Gestión de usuarios del portal
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search, Plus, MoreHorizontal, Mail, Ban, 
  RefreshCw, Trash2, Users, Eye, Shield
} from 'lucide-react';
import { InvitePortalUserDialog } from '@/components/portal-admin/InvitePortalUserDialog';
import { EditPortalUserDialog } from '@/components/portal-admin/EditPortalUserDialog';

interface PortalUser {
  id: string;
  email: string;
  name: string | null;
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  last_login: string | null;
  login_count: number;
  email_verified: boolean;
  permissions: Record<string, boolean>;
  created_at: string;
  portal: {
    id: string;
    slug: string;
    client: {
      id: string;
      full_name: string | null;
      company_name: string | null;
    } | null;
  } | null;
}

const STATUS_CONFIG = {
  active: { label: 'Activo', variant: 'default' as const, color: 'bg-green-500' },
  pending: { label: 'Pendiente', variant: 'secondary' as const, color: 'bg-yellow-500' },
  suspended: { label: 'Suspendido', variant: 'destructive' as const, color: 'bg-red-500' },
  revoked: { label: 'Revocado', variant: 'outline' as const, color: 'bg-gray-500' },
};

export default function PortalUsersPage() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<PortalUser | null>(null);

  // Fetch portal users
  const { data: users, isLoading } = useQuery({
    queryKey: ['portal-users', currentOrganization?.id, search, statusFilter],
    queryFn: async (): Promise<PortalUser[]> => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from('portal_users')
        .select(`
          id,
          email,
          name,
          status,
          last_login,
          login_count,
          email_verified,
          permissions,
          created_at,
          portal:client_portals!inner(
            id,
            slug,
            client:contacts(id, full_name, company_name)
          )
        `)
        .eq('portal.organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = (data as unknown as PortalUser[]) || [];

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(u => 
          u.email.toLowerCase().includes(searchLower) ||
          u.name?.toLowerCase().includes(searchLower) ||
          u.portal?.client?.full_name?.toLowerCase().includes(searchLower) ||
          u.portal?.client?.company_name?.toLowerCase().includes(searchLower)
        );
      }

      return filtered;
    },
    enabled: !!currentOrganization?.id,
  });

  // Update user status
  const updateStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from('portal_users')
        .update({ status })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el estado');
    },
  });

  // Resend invitation
  const resendInvitation = useMutation({
    mutationFn: async (userId: string) => {
      const user = users?.find(u => u.id === userId);
      if (!user) throw new Error('Usuario no encontrado');

      const response = await supabase.functions.invoke('portal-auth', {
        body: {
          action: 'magic_link',
          email: user.email,
          portal_id: user.portal?.id,
        },
      });

      if (response.error) throw response.error;
    },
    onSuccess: () => {
      toast.success('Invitación reenviada');
    },
    onError: () => {
      toast.error('Error al reenviar invitación');
    },
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('portal_users')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users'] });
      toast.success('Usuario eliminado');
      setDeletingUser(null);
    },
    onError: () => {
      toast.error('Error al eliminar usuario');
    },
  });

  const getClientName = (user: PortalUser) => {
    if (user.portal?.client?.company_name) return user.portal.client.company_name;
    if (user.portal?.client?.full_name) return user.portal.client.full_name;
    return 'Sin cliente';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios del Portal</h1>
          <p className="text-muted-foreground">
            Gestiona el acceso de tus clientes al portal
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invitar cliente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {!users?.length ? (
            <div className="p-8">
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="Sin usuarios del portal"
                description="Invita a tus clientes para que puedan acceder al portal"
                action={
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invitar cliente
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getClientName(user)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[user.status].variant}>
                        <span 
                          className={`w-2 h-2 rounded-full mr-1.5 ${STATUS_CONFIG[user.status].color}`} 
                        />
                        {STATUS_CONFIG[user.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.last_login), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Editar permisos
                          </DropdownMenuItem>
                          
                          {user.status === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => resendInvitation.mutate(user.id)}
                              disabled={resendInvitation.isPending}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Reenviar invitación
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {user.status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => updateStatus.mutate({ userId: user.id, status: 'suspended' })}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspender
                            </DropdownMenuItem>
                          )}

                          {user.status === 'suspended' && (
                            <DropdownMenuItem 
                              onClick={() => updateStatus.mutate({ userId: user.id, status: 'active' })}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reactivar
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar acceso
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

      {/* Dialogs */}
      <InvitePortalUserDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['portal-users'] });
        }}
      />

      {editingUser && (
        <EditPortalUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['portal-users'] });
            setEditingUser(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acceso al portal?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingUser?.name || deletingUser?.email} perderá el acceso al portal. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && deleteUser.mutate(deletingUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
