import { User } from './user';
import { VTuberProfile } from './vtuber';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface SessionUser extends User {
  vtuberProfile?: VTuberProfile;
}
