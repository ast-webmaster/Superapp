import type { ModuleManifest } from '@/shared/types/module';

import { priceApprovalRoutes } from './navigation/routes';

export const priceApprovalManifest: ModuleManifest = {
  id: 'price-approval',
  title: 'Price approval',
  description: 'Review and approve price change requests',
  route: priceApprovalRoutes.list,
  detailRoute: priceApprovalRoutes.detail,
  icon: 'clipboard',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: ['read_priceapproval', 'readonly_priceapproval_all'],
};
