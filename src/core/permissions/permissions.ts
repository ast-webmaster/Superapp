import { useCurrentUser, type AuthUser } from '@/core/auth';

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  return user?.permissions.includes(permission) ?? false;
}

/**
 * Returns a checker for the signed-in user. Passing no permission means "no
 * permission required" and always passes, so callers can forward an optional field.
 */
export function useCan() {
  const user = useCurrentUser();
  return (permission?: string) => permission === undefined || hasPermission(user, permission);
}
