/**
 * RequirePermission - Route protection component
 * 
 * Usage in routes:
 * <Route 
 *   path="/settings/roles" 
 *   element={
 *     <RequirePermission permission="roles.view">
 *       <RolesPage />
 *     </RequirePermission>
 *   } 
 * />
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface RequirePermissionProps {
  /** Single permission code to check */
  permission?: string;
  
  /** Multiple permission codes to check */
  permissions?: string[];
  
  /** If true, requires ALL permissions. If false, requires ANY. Default: false */
  requireAll?: boolean;
  
  /** Protected content */
  children: React.ReactNode;
  
  /** Redirect path when denied. If not provided, shows access denied page */
  redirectTo?: string;
  
  /** Custom access denied component */
  accessDeniedComponent?: React.ReactNode;
}

function AccessDeniedPage() {
  const location = useLocation();
  
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes los permisos necesarios para acceder a esta página.
            Contacta con un administrador si crees que deberías tener acceso.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button
            onClick={() => window.location.href = '/app/dashboard'}
          >
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

export function RequirePermission({
  permission,
  permissions,
  requireAll = false,
  children,
  redirectTo,
  accessDeniedComponent,
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();
  const location = useLocation();
  
  // Show loading state
  if (isLoading) {
    return <LoadingPage />;
  }
  
  // Determine if access is granted
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }
  
  // Access granted
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Access denied - redirect if specified
  if (redirectTo) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // Access denied - show custom component or default
  if (accessDeniedComponent) {
    return <>{accessDeniedComponent}</>;
  }
  
  return <AccessDeniedPage />;
}

/**
 * RequireRole - Simpler version that checks role directly
 */
interface RequireRoleProps {
  roles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireRole({ roles, children, redirectTo }: RequireRoleProps) {
  const { userRole, isLoading } = usePermissions();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingPage />;
  }
  
  const effectiveRole = userRole?.roleCode || userRole?.legacyRole;
  const hasRole = effectiveRole && roles.includes(effectiveRole);
  
  if (hasRole) {
    return <>{children}</>;
  }
  
  if (redirectTo) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  return <AccessDeniedPage />;
}

/**
 * RequireOwnerOrAdmin - Common pattern shortcut
 */
export function RequireOwnerOrAdmin({ children, redirectTo }: { children: React.ReactNode; redirectTo?: string }) {
  return (
    <RequireRole roles={['owner', 'admin']} redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}

export default RequirePermission;
