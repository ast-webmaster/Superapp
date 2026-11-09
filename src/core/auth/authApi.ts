import { apiClient } from '@/core/api';

import type {
  AuthUser,
  ChangePasswordInput,
  LoginCredentials,
  LoginResponse,
  SessionData,
  UpdateProfileInput,
} from './types';

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
  me: async (signal?: AbortSignal) => (await apiClient.get<SessionData>('/me', { signal })).data,
  /** Revokes only this device's token. */
  logout: () => apiClient.post('/logout'),
  /** Multipart, because of the photo. Answers the user as the server now has it. */
  updateProfile: async ({ name, photo }: UpdateProfileInput) => {
    const form = new FormData();
    form.append('name', name);
    if (photo) form.append('photo', photo);
    return (await apiClient.post<{ user: AuthUser }>('/me/profile', form)).data.user;
  },
  /** The server signs the user's other devices out; this device's token stays valid. */
  changePassword: ({ currentPassword, password, passwordConfirmation }: ChangePasswordInput) =>
    apiClient.put('/me/password', {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    }),
};
