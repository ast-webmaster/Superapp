import { env } from '@/core/config';
import type { AuthUser } from '@/core/auth';

/**
 * The user's own photo, or null. The backend's `profile_photo_url` is built from its APP_URL, a
 * host the phone often cannot reach, so the URL is built on the same host as the API instead
 * (the public disk is served from `/storage`). Without an upload that URL is only a placeholder.
 */
export function profilePhotoUri(user: AuthUser | null): string | null {
  if (!user?.profile_photo_path) return null;
  return `${env.apiUrl.replace(/\/api$/, '')}/storage/${user.profile_photo_path}`;
}
