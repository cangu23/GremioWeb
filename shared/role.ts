// 1. Rol Base (Identidad / Profesión - Solo uno)
export enum BaseRole {
  USER = 'USER',
  VTUBER = 'VTUBER',
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

export const isStaffRole = (role?: string | null): boolean => {
  if (!role) return false;
  const staffRoles = ['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'HELPER', 'OWNER'];
  return staffRoles.includes(role.toUpperCase());
};