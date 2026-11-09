export type AuthUser = {
  id: number;
  name: string;
  email: string;
  /** Storage path of the uploaded photo; null until the user sets one. */
  profile_photo_path: string | null;
  /** The photo's URL. Without an upload the backend answers a generated placeholder, so check the path. */
  profile_photo_url: string;
};

export type UpdateProfileInput = {
  name: string;
  /** A new photo; left out, the current one stays. */
  photo?: Blob;
};

export type ChangePasswordInput = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
  /** 6-digit TOTP code; required once the account has 2FA enabled. */
  code?: string;
  /** One-time recovery code, used instead of `code`. */
  recoveryCode?: string;
};

/** What the backend returns for the signed-in user, from login and from `/me`. */
export type SessionData = {
  user: AuthUser;
  /** Role names, e.g. "Sales". A user may hold several. */
  roles: string[];
  /** Permission names, e.g. "read_priceapproval". */
  permissions: string[];
};

export type LoginResponse = SessionData & {
  token: string;
  /** ISO 8601 with offset. The token is not renewed: the user signs in again after this. */
  expires_at: string;
};

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';
