export interface VTuberProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  lore?: string | null;
  socialLinks?: string | null;
  twitchUrl?: string | null;
  youtubeUrl?: string | null;
  kickUrl?: string | null;
  tiktokUrl?: string | null;
  twitterUrl?: string | null;
  discordUrl?: string | null;
  websiteUrl?: string | null;
  streamSchedule?: string | null;
  languages?: string | null;
  contentType?: string | null;
  live2dModel?: string | null;
  model3d?: string | null;
  fanName?: string | null;
  oshiMark?: string | null;
  themeColor?: string | null;
  hashtags?: string | null;
  isLive?: boolean;
  lastLiveAt?: string | null;
  isVerified?: boolean;
  isApproved?: boolean;
  isFeatured?: boolean;
  isHidden?: boolean;
}

export interface UpdateVTuberProfilePayload {
  displayName?: string;
  avatarUrl?: string;
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