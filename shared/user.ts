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
}

export interface UserProfile extends User {
  vtuberProfile?: VTuberProfile | null;
}

export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  vtuberProfile?: VTuberProfile | null;
}

export interface UpdateUserPayload extends UpdateVTuberProfilePayload {
  username?: string;
}