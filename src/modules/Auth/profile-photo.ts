import type { AuthUser } from '@/core/auth';

/** The user's own photo, or null: without an upload the backend's URL is a generated placeholder. */
export function profilePhotoUri(user: AuthUser | null): string | null {
  return user?.profile_photo_path ? user.profile_photo_url : null;
}
