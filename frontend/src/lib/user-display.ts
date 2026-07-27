/**
 * Resolve the best available display name for a user.
 * Priority: user.displayName → vtuberProfile.displayName → username
 */
export function getUserDisplayName(user: {
  displayName?: string | null;
  username: string;
  role?: string;
  vtuberProfile?: { displayName?: string | null } | null;
}): string {
  return user.displayName || (user.role === 'VTUBER' ? user.vtuberProfile?.displayName : null) || user.username;
}

/**
 * Resolve the best available avatar URL for a user.
 * Priority: user.avatarUrl → vtuberProfile.avatarUrl (if VTuber) → ''
 */
export function getUserAvatarUrl(user: {
  avatarUrl?: string | null;
  role?: string;
  vtuberProfile?: { avatarUrl?: string | null } | null;
}): string {
  return user.avatarUrl || (user.role === 'VTUBER' ? user.vtuberProfile?.avatarUrl : null) || '';
}
