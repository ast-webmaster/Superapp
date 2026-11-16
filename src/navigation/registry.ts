import { laporanPenjualanManifest } from '@/modules/LaporanPenjualan';
import { marketingActivityManifest } from '@/modules/MarketingActivity';
import { priceApprovalManifest } from '@/modules/PriceApproval';
import { purchaseRequestManifest } from '@/modules/PurchaseRequest';
import { stockPenjualanManifest } from '@/modules/StockPenjualan';
import type { ModuleManifest } from '@/shared/types/module';

// The one place that knows which business modules exist. To add a module:
// 1. export its manifest from the module's index.ts and list it here;
// 2. add its route files under src/app/(app)/<module>/ (thin re-exports of its screens).
export const moduleManifests: ModuleManifest[] = [
  priceApprovalManifest,
  purchaseRequestManifest,
  stockPenjualanManifest,
  laporanPenjualanManifest,
  marketingActivityManifest,
];
