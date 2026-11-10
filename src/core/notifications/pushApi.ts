import { apiClient } from '../api';

export const pushApi = {
  register: async (token: string, platform: 'android' | 'ios'): Promise<void> => {
    await apiClient.post('/me/device-tokens', { token, platform });
  },
};
