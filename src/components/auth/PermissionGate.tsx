/**
 * PermissionGate - Conditional rendering based on permissions
 * 
 * Usage:
 * <PermissionGate permission="docket.create">
 *   <CreateButton />
 * </PermissionGate>
 * 
 * <PermissionGate permissions={["docket.edit", "docket.delete"]} requireAll={false}>
 *   <EditMenu />
 * </PermissionGate>
 */

import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGateProps {
  /** Single permission code to check */
  permission?: string;
  
  /** Multiple permission codes to check */
  permissions?: string[];
  
  /** If true, requires ALL permissions. If false, requires ANY. Default: false */
  requireAll?: boolean;
  
  /** Content to show when permission is granted */
  children: React.ReactNode;
  
  /** Content to show when permission is denied. If not provided, nothing is rendered */
  fallback?: React.ReactNode;
  
  /** Show loading skeleton while checking permissions */
  showLoading?: boolean;
  
  /** Show access denied message instead of hiding */
  showDenied?: boolean;
  
  /** Custom denied message */
  deniedMessage?: string;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback,
  showLoading = false,
  showDenied = false,
  deniedMessage = 'No tienes permisos para ver este contenido',
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();
  
  // Show loading state
  if (isLoading && showLoading) {
    return <Skeleton className="h-8 w-full" />;
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
  
  // Render based on access
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Access denied
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showDenied) {
    return (
      <Alert variant="destructive" className="my-2">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>{deniedMessage}</AlertDescription>
      </Alert>
    );
  }
  
  // Default: render nothing
  return null;
}

/**
 * usePermissionCheck - Hook version for more complex logic
 */
export function usePermissionCheck(permission: string): {
  hasAccess: boolean;
  isLoading: boolean;
} {
  const { hasPermission, isLoading } = usePermissions();
  
  return {
    hasAccess: hasPermission(permission),
    isLoading,
  };
}

/**
 * withPermission - HOC for protecting entire components
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType
) {
  return function PermissionWrappedComponent(props: P) {
    const { hasPermission, isLoading } = usePermissions();
    
    if (isLoading) {
      return <Skeleton className="h-32 w-full" />;
    }
    
    if (!hasPermission(permission)) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <ShieldX className="mr-2 h-5 w-5" />
          <span>Acceso denegado</span>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}

export default PermissionGate;
