/**
 * Extracts the user's avatar URL from Discord OAuth session metadata
 */
export function getDiscordAvatar(session: any): string {
  if (!session?.user) return '';

  const meta = session.user.user_metadata || {};
  if (meta.avatar_url && typeof meta.avatar_url === 'string') return meta.avatar_url;
  if (meta.picture && typeof meta.picture === 'string') return meta.picture;

  const identity = session.user.identities?.find((i: any) => i.provider === 'discord');
  if (identity?.identity_data?.avatar_url) return identity.identity_data.avatar_url;
  if (identity?.identity_data?.picture) return identity.identity_data.picture;

  // Discord avatar URL construction if hash and provider_id exist
  const providerId = meta.provider_id || identity?.id;
  const avatarHash = meta.avatar || identity?.identity_data?.avatar;
  if (providerId && avatarHash) {
    return `https://cdn.discordapp.com/avatars/${providerId}/${avatarHash}.png`;
  }

  return '';
}
