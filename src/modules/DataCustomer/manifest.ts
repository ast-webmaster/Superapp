import type { ModuleManifest } from '@/shared/types/module';

import { dataCustomerRoutes } from './navigation/routes';

export const dataCustomerManifest: ModuleManifest = {
  id: 'data-customer',
  title: 'Data Customer',
  description: 'Browse the customer master',
  route: dataCustomerRoutes.list,
  icon: 'building',
  // The same either-or the backend middleware uses; the API answers 403 without one of them.
  permission: ['read_customer', 'read_all_customer'],
};
