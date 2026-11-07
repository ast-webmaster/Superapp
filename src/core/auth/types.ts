export type AuthUser = {
  id: number;
  name: string;
  email: string;
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
  /** Permission names, e.g. "read_priceapproval". */
  permissions: string[];
};

export type LoginResponse = SessionData & {
  token: string;
  /** ISO 8601 with offset. The token is not renewed: the user signs in again after this. */
  expires_at: string;
};

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';
