export type AuthUser = {
  id: number;
  name: string;
  email: string;
  /** Permission names granted by the backend, e.g. "price-approval.view". */
  permissions: string[];
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';
