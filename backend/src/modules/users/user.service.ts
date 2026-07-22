import AppError from '../../errors/AppError';
import * as UserRepository from './user.repository';
import { UpdateUserPayload, PublicUser, UserProfile } from '@gremio-estelar/shared';

export const getMe = async (userId: string): Promise<UserProfile> => {
  const userProfile = await UserRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new AppError('User not found', 404);
  }
  
  const { password, ...safeProfile } = userProfile;
  return safeProfile as UserProfile;
};

export const updateMe = async (userId: string, payload: UpdateUserPayload): Promise<UserProfile> => {
  if (payload.username) {
    const existingUser = await UserRepository.findByUsername(payload.username);
    if (existingUser && existingUser.id !== userId) {
      throw new AppError('Username is already taken', 409);
    }
  }

  const updatedProfile = await UserRepository.updateUserProfile(userId, payload);
  if (!updatedProfile) {
    throw new AppError('Failed to update user profile', 500);
  }

  const { password, ...safeProfile } = updatedProfile;
  return safeProfile as UserProfile;
};

export const getUsersByRole = async (role: string) => {
  return UserRepository.findByRole(role);
};

export const searchUsersForMention = async (query: string) => {
  if (!query || query.length < 2) {
    return UserRepository.searchByUsernameForMention('');
  }
  return UserRepository.searchByUsernameForMention(query);
};

export const searchUsers = async (query: string) => {
  // If no query or too short, return all VTubers (for directory browsing)
  if (!query || query.length < 2) {
    return UserRepository.searchByUsername('');
  }
  return UserRepository.searchByUsername(query);
};

export const updateNote = async (userId: string, note: string | null) => {
  const trimmed = note?.trim() || null;
  if (trimmed && trimmed.length > 100) {
    throw new AppError('La nota no puede tener más de 100 caracteres', 400);
  }
  const updated = await UserRepository.updateUser(userId, {
    note: trimmed,
    noteUpdatedAt: trimmed ? new Date() : null,
  });
  return { note: updated.note, noteUpdatedAt: updated.noteUpdatedAt };
};

export const getPublicUser = async (userId: string): Promise<PublicUser> => {
  const userProfile = await UserRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new AppError('User not found', 404);
  }

  return {
    id: userProfile.id,
    username: userProfile.username,
    role: userProfile.role as unknown as PublicUser['role'],
    displayName: userProfile.displayName,
    avatarUrl: userProfile.avatarUrl,
    bio: userProfile.bio,
    vtuberProfile: userProfile.vtuberProfile as unknown as PublicUser['vtuberProfile'],
  };
};