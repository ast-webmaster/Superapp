import type { ModuleManifest } from '@/shared/types/module';

import { dataProductRoutes } from './navigation/routes';

export const dataProductManifest: ModuleManifest = {
  id: 'data-product',
  title: 'Data Product',
  description: 'Browse the product master',
  route: dataProductRoutes.list,
  icon: 'box',
  // The API answers 403 without this; hide the entry instead of opening an error screen.
  permission: 'read_product',
};
