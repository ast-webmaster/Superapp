import { apiClient } from '@/core/api';

import type {
  PageMeta,
  ProductCategory,
  ProductDetail,
  ProductFilters,
  ProductListItem,
  ProductPage,
} from '../types';

const PAGE_SIZE = 15;

// The backend module is called Product, so its path is `product`.
const PATH = '/product';

export const dataProductApi = {
  list: async (
    filters: ProductFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<ProductPage> => {
    const { data, meta } = await apiClient.get<ProductListItem[], PageMeta>(PATH, {
      query: {
        search: search || undefined,
        category_code: filters.categoryCode ?? undefined,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    return { items: data, meta };
  },

  detail: async (id: string, signal?: AbortSignal) =>
    (await apiClient.get<ProductDetail>(`${PATH}/${id}`, { signal })).data,

  categories: async (signal?: AbortSignal) =>
    (await apiClient.get<ProductCategory[]>(`${PATH}/categories`, { signal })).data,
};
