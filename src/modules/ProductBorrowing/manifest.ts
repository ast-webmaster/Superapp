import type { ModuleManifest } from '@/shared/types/module';

import { productBorrowingRoutes } from './navigation/routes';

export const productBorrowingManifest: ModuleManifest = {
  id: 'product-borrowing',
  title: 'Product Borrowing',
  description: 'Lend products to customers and track their return',
  route: productBorrowingRoutes.list,
  detailRoute: productBorrowingRoutes.detail,
  icon: 'box',
  // The API answers 403 without one of these (the same list the web middleware uses); hide the
  // entry instead of opening an error screen.
  permission: [
    'create_product_borrowing',
    'read_product_borrowing',
    'read_all_product_borrowing',
    'approve_product_borrowing_as_product_manager',
    'approve_product_borrowing_as_manager',
    'process_product_borrowing',
    'process_product_borrowing_as_logistic',
  ],
};
