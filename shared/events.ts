export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string | null;
  maxAttendees?: number | null;
  coverUrl?: string | null;
  status: 'UPCOMING' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
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
    attendees: number;
  };
  isAttending?: boolean;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  date: string;
  location?: string;
  maxAttendees?: number;
  coverUrl?: string;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  maxAttendees?: number;
  coverUrl?: string;
  status?: 'UPCOMING' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
}
