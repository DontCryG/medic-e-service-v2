/**
 * Extracts the user's avatar URL from Discord OAuth session metadata
 * Supports custom avatars, animated avatars, and official Discord default avatars
 */
export function getDiscordAvatar(session: any, fallbackDiscordId?: string): string {
  const meta = session?.user?.user_metadata || {};
  const identity = session?.user?.identities?.find((i: any) => i.provider === 'discord');
  const idData = identity?.identity_data || {};

  // 1. Resolve Discord Snowflake ID (Numeric ID, NOT UUID)
  const discordId = 
    fallbackDiscordId || 
    meta.provider_id || 
    meta.sub || 
    idData.provider_id || 
    idData.sub || 
    (identity?.id && !identity.id.includes('-') ? identity.id : undefined);

  // 2. Check if there is a custom avatar hash
  const avatarHash = meta.avatar || idData.avatar;
  if (discordId && avatarHash) {
    const ext = String(avatarHash).startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=256`;
  }

  // 3. Direct URLs provided by Supabase / Discord
  const directUrl = meta.avatar_url || meta.picture || idData.avatar_url || idData.picture;
  if (directUrl && typeof directUrl === 'string' && !directUrl.includes('undefined')) {
    return directUrl;
  }

  // 4. Default Discord Avatar fallback based on Discord Snowflake ID
  if (discordId) {
    try {
      const idx = Number((BigInt(discordId) >> 22n) % 6n);
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {
      return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
  }

  return '';
}
