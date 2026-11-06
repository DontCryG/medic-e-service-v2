/**
 * Centralized Permission & Role Utilities
 * Standardizes role checking across the entire application to prevent permission discrepancies.
 */

export const ADMIN_ROLES = [
  'admin',
  'superadmin',
  'director',
  'deputy_director',
  'co-director',
  'management'
] as const;

export type AdminRole = typeof ADMIN_ROLES[number];

/**
 * Checks if a given role has administrative/management privileges.
 * Covers director, deputy_director, co-director, management, admin, and superadmin.
 */
export function isAdmin(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return ADMIN_ROLES.some(r => r === normalized);
}

/**
 * Checks if a user has management access (alias of isAdmin for semantic clarity)
 */
export function isManager(role?: string | null): boolean {
  return isAdmin(role);
}
