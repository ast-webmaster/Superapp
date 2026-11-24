import type { ModuleManifest } from '@/shared/types/module';

import { salesVisitationRoutes } from './navigation/routes';

export const salesVisitationManifest: ModuleManifest = {
  id: 'sales-visitation',
  title: 'Sales Visitation',
  description: 'Plan customer visits, then check in and out on site',
  route: salesVisitationRoutes.list,
  detailRoute: salesVisitationRoutes.detail,
  icon: 'pin',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: [
    'create_sales_visitation',
    'read_sales_visitation',
    'read_sales_visitation_team',
    'read_sales_visitation_all',
    'read_visitation_product_manager',
  ],
};
