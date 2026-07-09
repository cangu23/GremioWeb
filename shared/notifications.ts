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
