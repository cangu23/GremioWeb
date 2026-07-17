export interface Friend {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
      isVerified: boolean;
    } | null;
  };
  receiver?: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
      isVerified: boolean;
    } | null;
  };
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt: string;
  user: {
    id: string;
    username: string;
    vtuberProfile?: {
      displayName: string;
      avatarUrl: string | null;
      isVerified: boolean;
    } | null;
  };
}
