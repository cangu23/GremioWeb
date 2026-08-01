import { StaffRole } from '@gremio-estelar/shared';

export enum Permission {
  VIEW_ADMIN_PANEL = 'VIEW_ADMIN_PANEL',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MODERATE_CONTENT = 'MODERATE_CONTENT',
  REVIEW_REPORTS = 'REVIEW_REPORTS',
  CREATE_OFFICIAL_EVENTS = 'CREATE_OFFICIAL_EVENTS',
  VIEW_SYSTEM_LOGS = 'VIEW_SYSTEM_LOGS',
  VIEW_IP_DEVICES = 'VIEW_IP_DEVICES',
}

export const staffPermissions: Record<string, Permission[]> = {
  OWNER: [
    Permission.VIEW_ADMIN_PANEL,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MODERATE_CONTENT,
    Permission.REVIEW_REPORTS,
    Permission.CREATE_OFFICIAL_EVENTS,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.VIEW_IP_DEVICES,
  ],
  ADMIN: [
    Permission.VIEW_ADMIN_PANEL,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MODERATE_CONTENT,
    Permission.REVIEW_REPORTS,
    Permission.CREATE_OFFICIAL_EVENTS,
    Permission.VIEW_SYSTEM_LOGS,
  ],
  STAFF: [
    Permission.VIEW_ADMIN_PANEL,
    Permission.MODERATE_CONTENT,
    Permission.REVIEW_REPORTS,
    Permission.CREATE_OFFICIAL_EVENTS,
  ],
  MOD: [
    Permission.VIEW_ADMIN_PANEL,
    Permission.MODERATE_CONTENT,
    Permission.REVIEW_REPORTS,
  ],
  HELPER: [
    Permission.REVIEW_REPORTS,
  ],
  NONE: [],
};

export const rolePermissions = staffPermissions;

export const checkPermission = (role: string, permission: Permission): boolean => {
  if (!role) return false;
  const roles = role.split(',').map(r => r.trim().toUpperCase());
  return roles.some(r => staffPermissions[r]?.includes(permission));
};
