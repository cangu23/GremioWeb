import type { SurveyQuestion } from './vtuber-survey';

export const STREAMER_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'platforms',
    question: '¿En qué plataformas transmites? (Twitch, YouTube, Kick, etc.)',
    type: 'text',
    placeholder: 'Ej: Twitch y YouTube',
    required: true,
  },
  {
    id: 'schedule',
    question: '¿Cuál es tu horario habitual de transmisión?',
    type: 'text',
    placeholder: 'Ej: Lun-Vie 20:00 UTC',
    required: true,
  },
  {
    id: 'content',
    question: '¿Qué tipo de contenido transmites principalmente?',
    type: 'text',
    placeholder: 'Ej: Gaming, Just Chatting, Música, IRL...',
    required: true,
  },
  {
    id: 'experience',
    question: '¿Cuánta experiencia tienes haciendo streams?',
    type: 'text',
    placeholder: 'Ej: 2 años, 500 horas...',
    required: false,
  },
  {
    id: 'bio',
    question: 'Cuéntanos sobre ti y qué hace especial a tu canal',
    type: 'textarea',
    placeholder: 'Tu historia, tu comunidad, tus metas...',
    required: false,
  },
];

export interface StreamerProfile {
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

export interface UpdateStreamerProfilePayload {
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
