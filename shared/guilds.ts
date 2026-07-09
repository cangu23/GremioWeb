export interface GuildData {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  tags?: string | null;
  createdAt: string;
  creatorId: string;
  creator?: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  _count?: {
    members: number;
  };
  isMember?: boolean;
  myRole?: string | null;
  members?: GuildMemberData[];
}

export interface GuildMemberData {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
}

export interface CreateGuildPayload {
  name: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  tags?: string;
}
