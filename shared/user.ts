import { Role } from './role';
import { AccountStatus } from './account-status';
import { AuthProvider } from './auth-provider';
import { VTuberProfile, UpdateVTuberProfilePayload } from './vtuber';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: AccountStatus;
  provider: AuthProvider;
  createdAt: Date;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface UserProfile extends User {
  vtuberProfile?: VTuberProfile | null;
}

export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  vtuberProfile?: VTuberProfile | null;
}

export interface UpdateUserPayload {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  // VTuber-specific fields (handled by VTuberProfile)
  bannerUrl?: string;
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
}