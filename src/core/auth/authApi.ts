import { apiClient } from '@/core/api';

import type { LoginCredentials, LoginResponse, SessionData } from './types';

export const authApi = {
  login: async ({ recoveryCode, ...credentials }: LoginCredentials, deviceName: string) => {
    const response = await apiClient.post<LoginResponse>('/login', {
      ...credentials,
      recovery_code: recoveryCode,
      device_name: deviceName,
    });
    return response.data;
  },
  /** Fresh profile and permissions for the token in use. */
  me: async () => (await apiClient.get<SessionData>('/me')).data,
  /** Revokes only this device's token. */
  logout: () => apiClient.post('/logout'),
};
