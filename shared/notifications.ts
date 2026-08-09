export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MENTION: 'mention',
  SHARE: 'share',
  EVENT_CREATED: 'event_created',
  EVENT_ATTEND: 'event_attend',
  GUILD_JOINED: 'guild_joined',
  GUILD_REQUEST: 'guild_request',
  ACHIEVEMENT: 'achievement',
  LEVEL_UP: 'level_up',
  DM: 'dm',
  VTUBER_REQUEST: 'vtuber_request',
  STREAMER_REQUEST: 'streamer_request',
  VTUBER_APPROVED: 'vtuber_approved',
  VTUBER_REJECTED: 'vtuber_rejected',
  VTUBER_VERIFIED: 'vtuber_verified',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPT: 'friend_accept',
  VTUBER_APPROVED_VERIFIED: 'vtuber_approved_verified',
  STREAMER_APPROVED: 'streamer_approved',
  STREAMER_REJECTED: 'streamer_rejected',
  STREAMER_VERIFIED: 'streamer_verified',

  // Warnings / Moderation
  WARNING: 'warning',
  POST_DELETED: 'post_deleted',
  COMMENT_DELETED: 'comment_deleted',

  // Admin grants
  PLAN_GRANTED: 'plan_granted',
  PLAN_REVOKED: 'plan_revoked',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface NotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}
