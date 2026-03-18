/**
 * usePermissions Hook - React hook for RBAC permission checking
 * 
 * Provides:
 * - hasPermission(code) - Check single permission
 * - hasAnyPermission(codes) - Check if user has any of the permissions
 * - hasAllPermissions(codes) - Check if user has all permissions
 * - userRole - Current user's role info
 * - permissions - All user permissions
 * - isLoading - Loading state
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import {
  getUserRole,
  getUserPermissions,
  checkPermission,
  getAvailableRoles,
  Permission,
  Role,
  UserRole,
  SYSTEM_ROLES,
  SYSTEM_ROLE_IDS,
} from '@/services/permission-service';

// Export types and constants
export type { Permission, Role, UserRole };
export { SYSTEM_ROLES, SYSTEM_ROLE_IDS };

export interface UsePermissionsResult {
  // Permission checking
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  checkPermissionAsync: (code: string) => Promise<boolean>;
  
  // Role info
  userRole: UserRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isMember: boolean;
  isViewer: boolean;
  isExternal: boolean;
  
  // All permissions
  permissions: Permission[];
  
  // Available roles
  availableRoles: Role[];
  
  // Loading states
  isLoading: boolean;
  isRoleLoading: boolean;
  isPermissionsLoading: boolean;
  
  // Utilities
  refreshPermissions: () => void;
  canManageRole: (targetRoleCode: string) => boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  const userId = user?.id;
  const organizationId = currentOrganization?.id;
  const enabled = !!userId && !!organizationId;
  
  // Fetch user role
  const {
    data: userRole,
    isLoading: isRoleLoading,
  } = useQuery({
    queryKey: ['user-role', userId, organizationId],
    queryFn: () => getUserRole(userId!, organizationId!),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch user permissions
  const {
    data: permissions = [],
    isLoading: isPermissionsLoading,
  } = useQuery({
    queryKey: ['user-permissions', userId, organizationId],
    queryFn: () => getUserPermissions(userId!, organizationId!),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch available roles
  const {
    data: availableRoles = [],
  } = useQuery({
    queryKey: ['available-roles', organizationId],
    queryFn: () => getAvailableRoles(organizationId),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Get effective role code (new system or legacy)
  const effectiveRoleCode = userRole?.roleCode || userRole?.legacyRole || null;
  
  // Role checks
  const isOwner = effectiveRoleCode === SYSTEM_ROLES.OWNER;
  const isAdmin = effectiveRoleCode === SYSTEM_ROLES.ADMIN;
  const isManager = effectiveRoleCode === SYSTEM_ROLES.MANAGER;
  const isMember = effectiveRoleCode === SYSTEM_ROLES.MEMBER;
  const isViewer = effectiveRoleCode === SYSTEM_ROLES.VIEWER;
  const isExternal = effectiveRoleCode === SYSTEM_ROLES.EXTERNAL;
  
  // Synchronous permission check (uses cached permissions)
  const hasPermission = (code: string): boolean => {
    // Owner has all permissions
    if (isOwner) return true;
    return permissions.some(p => p.code === code);
  };
  
  // Check if user has any of the permissions
  const hasAnyPermission = (codes: string[]): boolean => {
    if (isOwner) return true;
    return codes.some(code => hasPermission(code));
  };
  
  // Check if user has all permissions
  const hasAllPermissions = (codes: string[]): boolean => {
    if (isOwner) return true;
    return codes.every(code => hasPermission(code));
  };
  
  // Async permission check (calls DB)
  const checkPermissionAsync = async (code: string): Promise<boolean> => {
    if (!userId || !organizationId) return false;
    return checkPermission(userId, organizationId, code);
  };
  
  // Refresh permissions cache
  const refreshPermissions = () => {
    queryClient.invalidateQueries({ queryKey: ['user-role', userId, organizationId] });
    queryClient.invalidateQueries({ queryKey: ['user-permissions', userId, organizationId] });
    queryClient.invalidateQueries({ queryKey: ['available-roles', organizationId] });
  };
  
  // Check if current user can manage a target role
  // Users can only manage roles with lower hierarchy level
  const canManageRole = (targetRoleCode: string): boolean => {
    if (!effectiveRoleCode) return false;
    
    const currentRole = availableRoles.find(r => r.code === effectiveRoleCode);
    const targetRole = availableRoles.find(r => r.code === targetRoleCode);
    
    if (!currentRole || !targetRole) return false;
    
    // Can only manage roles with lower hierarchy
    return currentRole.hierarchyLevel > targetRole.hierarchyLevel;
  };
  
  return {
    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionAsync,
    
    // Role info
    userRole: userRole || null,
    isOwner,
    isAdmin,
    isManager,
    isMember,
    isViewer,
    isExternal,
    
    // All permissions
    permissions,
    
    // Available roles
    availableRoles,
    
    // Loading states
    isLoading: isRoleLoading || isPermissionsLoading,
    isRoleLoading,
    isPermissionsLoading,
    
    // Utilities
    refreshPermissions,
    canManageRole,
  };
}

export default usePermissions;
