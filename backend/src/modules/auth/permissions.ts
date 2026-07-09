import { Role } from '@gremio-estelar/shared';

export enum Permission {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_ADMIN_PANEL = 'VIEW_ADMIN_PANEL',
  MODERATE_CONTENT = 'MODERATE_CONTENT',
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_ADMIN_PANEL,
    Permission.MODERATE_CONTENT,
  ],
  [Role.MODERATOR]: [
    Permission.MODERATE_CONTENT,
    Permission.VIEW_ADMIN_PANEL,
  ],
  [Role.VTUBER]: [],
  [Role.USER]: [],
};

export const checkPermission = (role: Role, permission: Permission): boolean => {
  return rolePermissions[role]?.includes(permission) || false;
};
