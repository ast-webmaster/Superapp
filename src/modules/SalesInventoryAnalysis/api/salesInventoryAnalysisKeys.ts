import type { AnalysisSelection } from '../types';

/** Every React Query key of this module. The first segment is the manifest id. */
export const salesInventoryAnalysisKeys = {
  all: ['sales-inventory-analysis'] as const,
  filters: () => [...salesInventoryAnalysisKeys.all, 'filters'] as const,
  inventory: (selection: AnalysisSelection) =>
    [...salesInventoryAnalysisKeys.all, 'inventory', selection] as const,
  inactiveDealers: (selection: AnalysisSelection) =>
    [...salesInventoryAnalysisKeys.all, 'inactive-dealers', selection] as const,
  dealerActivity: (selection: AnalysisSelection) =>
    [...salesInventoryAnalysisKeys.all, 'dealer-activity', selection] as const,
  achievement: (selection: AnalysisSelection) =>
    [...salesInventoryAnalysisKeys.all, 'achievement', selection] as const,
};
