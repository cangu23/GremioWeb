import { User } from './user';
import { VTuberProfile } from './vtuber';

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface UserSocialProfile {
  id: string;
  username: string;
  role: string;
  vtuberProfile?: VTuberProfile | null;
  _count: {
    followers: number;
    following: number;
  };
  isFollowedByMe?: boolean;
}
