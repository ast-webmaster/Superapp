import type { ModuleManifest } from '@/shared/types/module';

import { purchaseRequestRoutes } from './navigation/routes';

export const purchaseRequestManifest: ModuleManifest = {
  id: 'purchase-request',
  title: 'Purchase Request',
  description: 'Request purchases and approve them',
  route: purchaseRequestRoutes.list,
  detailRoute: purchaseRequestRoutes.detail,
  icon: 'cart',
  // The API answers 403 without this; hide the entry instead of opening an error screen.
  permission: 'read_purchase_request',
};
