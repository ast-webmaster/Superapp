import type { ModuleManifest } from '@/shared/types/module';

import { salesInventoryAnalysisRoutes } from './navigation/routes';

export const salesInventoryAnalysisManifest: ModuleManifest = {
  id: 'sales-inventory-analysis',
  title: 'Sales & Inventory Analysis',
  description: 'Stock cover, dealer activity and sales against target',
  route: salesInventoryAnalysisRoutes.home,
  icon: 'chart',
  // The same either-or the backend controller checks; without one it answers 403.
  permission: [
    'read_sales_inventory_analysis_by_all',
    'read_sales_inventory_analysis_by_branch',
    'read_sales_inventory_analysis_by_brand',
  ],
};
