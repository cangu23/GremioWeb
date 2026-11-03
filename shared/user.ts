import { Role } from './role';
import { AccountStatus } from './account-status';
import { AuthProvider } from './auth-provider';
import { VTuberProfile, UpdateVTuberProfilePayload } from './vtuber';
import { StreamerProfile } from './streamer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  displayedRole?: string | null;
  status: AccountStatus;
  provider: AuthProvider;
  createdAt: Date;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  bannerColor?: string | null;
  plan?: string;
  verifiedUntil?: string | Date | null;
  isVerified?: boolean;
  profileMusic?: string | null;
  // Marco premium del plan (STELLAR dorado / NOVA morado / ASTRO azul):
  // 'OFF' lo oculta; cualquier otro valor o null lo muestra (fallback del avatar).
  profileFrame?: string | null;
  // Personalización avanzada de tarjeta VIP
  profileBg?: string | null;
  profileTheme?: string | null;
  profileParticles?: string | null;
}

export interface UserProfile extends User {
  vtuberProfile?: VTuberProfile | null;
  streamerProfile?: StreamerProfile | null;
}

export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  displayedRole?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  isVerified?: boolean;
  createdAt?: string | Date | null;
  vtuberProfile?: VTuberProfile | null;
  streamerProfile?: StreamerProfile | null;
  profileBg?: string | null;
  profileTheme?: string | null;
  profileParticles?: string | null;
  bannerColor?: string | null;
}

export interface UpdateUserPayload {
  username?: string;
  displayedRole?: string | null;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  // VTuber-specific fields (handled by VTuberProfile)
  bannerUrl?: string | null;
  bannerColor?: string | null;
  description?: string;
  lore?: string;
  socialLinks?: Record<string, string>;
  twitchUrl?: string;
  youtubeUrl?: string;
  kickUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  websiteUrl?: string;
  streamSchedule?: string;
  languages?: string[];
  contentType?: string;
  live2dModel?: string;
  model3d?: string;
  fanName?: string;
  oshiMark?: string;
  themeColor?: string;
  hashtags?: string[];
  isLive?: boolean;
  // Profile music (Spotify link) — premium feature
  profileMusic?: string | null;
  profileFrame?: string | null;
  profileBg?: string | null;
  profileTheme?: string | null;
  profileParticles?: string | null;
}

/**
 * Determina si un usuario se registró recientemente (por defecto en los últimos 7 días).
 * Se calcula dinámicamente respecto a createdAt para que expire automáticamente.
 */
export const NEW_USER_THRESHOLD_DAYS = 7;

export const isNewUser = (createdAt?: string | Date | null, days = NEW_USER_THRESHOLD_DAYS): boolean => {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return false;
  const diffMs = Date.now() - createdTime;
  return diffMs >= 0 && diffMs < days * 24 * 60 * 60 * 1000;
};
