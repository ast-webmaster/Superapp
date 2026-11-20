import { apiClient } from '@/core/api';

import type { CustomerDetail, CustomerListItem, CustomerPage, PageMeta } from '../types';

const PAGE_SIZE = 15;

// The backend module is called Customer, so its path is `customer`.
const PATH = '/customer';

export const dataCustomerApi = {
  list: async (search: string, page: number, signal?: AbortSignal): Promise<CustomerPage> => {
    const { data, meta } = await apiClient.get<CustomerListItem[], PageMeta>(PATH, {
      query: { search: search || undefined, page, per_page: PAGE_SIZE },
      signal,
    });
    return { items: data, meta };
  },

  detail: async (id: string, signal?: AbortSignal) =>
    (await apiClient.get<CustomerDetail>(`${PATH}/${id}`, { signal })).data,
};
