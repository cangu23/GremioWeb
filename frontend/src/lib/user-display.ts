/**
 * Resolve the best available display name for a user.
 * Priority: user.displayName → vtuberProfile.displayName → username
 */
export function getUserDisplayName(user: {
  displayName?: string | null;
  username: string;
  vtuberProfile?: { displayName?: string | null } | null;
}): string {
  return user.displayName || user.vtuberProfile?.displayName || user.username;
}

/**
 * Resolve the best available avatar URL for a user.
 * Priority: user.avatarUrl → vtuberProfile.avatarUrl → ''
 */
export function getUserAvatarUrl(user: {
  avatarUrl?: string | null;
  vtuberProfile?: { avatarUrl?: string | null } | null;
}): string {
  return user.avatarUrl || user.vtuberProfile?.avatarUrl || '';
}
