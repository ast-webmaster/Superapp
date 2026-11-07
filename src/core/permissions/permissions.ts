import { usePermissions } from '@/core/auth';

/** One permission, or a list of which any one is enough. */
export type PermissionRequirement = string | readonly string[];

export function hasPermission(granted: readonly string[], required: PermissionRequirement): boolean {
  return typeof required === 'string'
    ? granted.includes(required)
    : required.some((permission) => granted.includes(permission));
}

/**
 * Returns a checker for the signed-in user. Passing no permission means "no
 * permission required" and always passes, so callers can forward an optional field.
 */
export function useCan() {
  const granted = usePermissions();
  return (required?: PermissionRequirement) => required === undefined || hasPermission(granted, required);
}
