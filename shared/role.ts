// 1. Rol Base (Identidad / Profesión - Solo uno)
export enum BaseRole {
  USER = 'USER',
  VTUBER = 'VTUBER',
  STREAMER = 'STREAMER',
  ARTIST = 'ARTIST',
  CLIPPER = 'CLIPPER',
  MAID = 'MAID',
  PARTNER = 'PARTNER',
}

// 2. Plan Premium (Suscripción & Beneficios - Solo uno)
export enum PlanTier {
  FREE = 'FREE',
  ASTRO = 'ASTRO',
  NOVA = 'NOVA',
  STELLAR = 'STELLAR',
}

// 3. Cargo de Autoridad (Staff & Moderación - Solo uno)
export enum StaffRole {
  NONE = 'NONE',
  HELPER = 'HELPER',
  MOD = 'MOD',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

// 4. Insignias / Distinciones (Acumulables - Múltiples)
export enum BadgeType {
  FOUNDER = 'FOUNDER',
  BETA_TESTER = 'BETA_TESTER',
  DONATOR = 'DONATOR',
  VERIFIED = 'VERIFIED',
  DEVELOPER = 'DEVELOPER',
  LEGENDARY = 'LEGENDARY',
  EARLY_100 = 'EARLY_100',
  VETERAN_1YR = 'VETERAN_1YR',
  EVENT_WINNER = 'EVENT_WINNER',
}

// Legacy Role Enum for backwards compatibility
export enum Role {
  USER = 'USER',
  VTUBER = 'VTUBER',
  STREAMER = 'STREAMER',
  MAID = 'MAID',
  ARTIST = 'ARTIST',
  CLIPPER = 'CLIPPER',
  VIP_ASTRO = 'VIP_ASTRO',
  VIP_NOVA = 'VIP_NOVA',
  VIP_STELLAR = 'VIP_STELLAR',
  STAFF = 'STAFF',
  BETA_TESTER = 'BETA_TESTER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  BOT = 'BOT',
}

export const parseUserRoles = (role?: string | null): string[] => {
  if (!role) return ['USER'];
  const roles = role.split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
  return roles.length > 0 ? roles : ['USER'];
};

export const hasAnyRole = (role?: string | null, targetRoles: string[] = []): boolean => {
  const userRoles = parseUserRoles(role);
  // God Mode: ADMIN and OWNER automatically pass any role check
  if (userRoles.some(r => ['ADMIN', 'OWNER', 'SYSADMIN'].includes(r))) {
    return true;
  }
  const targets = targetRoles.map(t => t.toUpperCase());
  return userRoles.some(r => targets.includes(r));
};

export const ROLE_PRIORITY = ['ADMIN', 'OWNER', 'STAFF', 'MODERATOR', 'VTUBER', 'STREAMER', 'MAID', 'BETA_TESTER', 'USER'];

export const getPrimaryRole = (roleStr?: string | null, displayedRole?: string | null): string => {
  const userRoles = parseUserRoles(roleStr);
  if (displayedRole && userRoles.includes(displayedRole.toUpperCase())) {
    return displayedRole.toUpperCase();
  }
  for (const pRole of ROLE_PRIORITY) {
    if (userRoles.includes(pRole)) return pRole;
  }
  return userRoles[0] || 'USER';
};

export const isStaffRole = (role?: string | null): boolean => {
  if (!role) return false;
  const userRoles = parseUserRoles(role);
  const staffRoles = ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'HELPER', 'OWNER', 'SYSADMIN'];
  return userRoles.some(r => staffRoles.includes(r));
};

export const isAdminRole = (role?: string | null): boolean => {
  if (!role) return false;
  const userRoles = parseUserRoles(role);
  return userRoles.some(r => ['ADMIN', 'OWNER', 'SYSADMIN'].includes(r));
};