import type { ModuleManifest } from '@/shared/types/module';

import { priceApprovalRoutes } from './navigation/routes';

export const priceApprovalManifest: ModuleManifest = {
  id: 'price-approval',
  title: 'Price Approval',
  description: 'Review and approve price change requests',
  route: priceApprovalRoutes.list,
  // Set `permission` once the backend's permission names are known (e.g. 'price-approval.view').
};
