import { apiClient } from '@/core/api';

import type { AuthUser, LoginCredentials, LoginResponse } from './types';

// ASSUMED backend contract (Sanctum-style bearer token). If the Laravel endpoints or
// response shapes differ, this is the only file that needs to change.
export const authApi = {
  login: (credentials: LoginCredentials) => apiClient.post<LoginResponse>('/auth/login', credentials),
  me: () => apiClient.get<AuthUser>('/auth/me'),
  logout: () => apiClient.post<void>('/auth/logout'),
};
