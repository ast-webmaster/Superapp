import type { ModuleManifest } from '@/shared/types/module';

import { registerCustomerRoutes } from './navigation/routes';

export const registerCustomerManifest: ModuleManifest = {
  id: 'register-customer',
  title: 'Register Customer',
  description: 'Register new customers and approve registrations',
  route: registerCustomerRoutes.list,
  detailRoute: registerCustomerRoutes.detail,
  icon: 'users',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: [
    'create_registercustomer',
    'read_registercustomer',
    'readall_registercustomer',
    'approve_as_manager_registercustomer',
    'approve_as_finance_registercustomer',
  ],
};
