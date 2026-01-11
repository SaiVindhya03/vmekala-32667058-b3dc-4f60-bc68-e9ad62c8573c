import { Role, Permission } from '@vmekala/data';

/**
 * Role hierarchy mapping - defines which permissions each role has
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.VIEW_AUDIT_LOG,
  ],
  [Role.ADMIN]: [
    Permission.CREATE_TASK,
    Permission.READ_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.VIEW_AUDIT_LOG,
  ],
  [Role.VIEWER]: [Permission.READ_TASK],
};

/**
 * Check if a role has a specific permission
 * @param role - The role to check
 * @param permission - The permission to verify
 * @returns true if the role has the permission, false otherwise
 */
export function checkPermission(role: string, permission: string): boolean {
  const roleKey = role as Role;
  const permissionKey = permission as Permission;

  if (!ROLE_PERMISSIONS[roleKey]) {
    return false;
  }

  return ROLE_PERMISSIONS[roleKey].includes(permissionKey);
}

/**
 * Get all permissions for a given role
 * @param role - The role to get permissions for
 * @returns Array of permissions for the role
 */
export function getRolePermissions(role: string): string[] {
  const roleKey = role as Role;
  return ROLE_PERMISSIONS[roleKey] || [];
}

/**
 * Check if a user (with multiple roles) has a specific permission
 * @param roles - Array of user roles
 * @param permission - The permission to verify
 * @returns true if any of the user's roles has the permission
 */
export function userHasPermission(
  roles: string[],
  permission: string
): boolean {
  return roles.some((role) => checkPermission(role, permission));
}

/**
 * Get all unique permissions for a user with multiple roles
 * @param roles - Array of user roles
 * @returns Array of unique permissions
 */
export function getUserPermissions(roles: string[]): string[] {
  const permissions = roles.flatMap((role) => getRolePermissions(role));
  return [...new Set(permissions)];
}
