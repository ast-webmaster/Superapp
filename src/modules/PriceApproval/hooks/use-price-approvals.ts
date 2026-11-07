import { useQuery } from '@tanstack/react-query';

import { priceApprovalApi } from '../api/priceApprovalApi';
import type { PriceApprovalFilter } from '../types';

export function usePriceApprovals(filter: PriceApprovalFilter) {
  return useQuery({
    queryKey: ['price-approvals', 'list', filter],
    queryFn: ({ signal }) => priceApprovalApi.list(filter, signal),
  });
}
