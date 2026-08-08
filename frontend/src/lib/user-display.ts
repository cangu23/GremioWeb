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
  return user.displayName || user.vtuberProfile?.displayName || user.username;
}

/**
 * Resolve the best available avatar URL for a user.
 * Priority: user.avatarUrl → vtuberProfile.avatarUrl → ''
 */
export function getUserAvatarUrl(user: {
  avatarUrl?: string | null;
  role?: string;
  vtuberProfile?: { avatarUrl?: string | null } | null;
}): string {
  return user.avatarUrl || user.vtuberProfile?.avatarUrl || '';
}

/**
 * Normaliza un username para comparaciones de confirmación (borrar cuenta):
 * recorta espacios y tolera la arroba inicial (ej: "@kira" → "kira").
 */
export function normalizeUsername(name: string): string {
  return name.trim().replace(/^@/, '');
}
