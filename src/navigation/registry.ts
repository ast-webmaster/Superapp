import { laporanPenjualanManifest } from '@/modules/LaporanPenjualan';
import { marketingActivityManifest } from '@/modules/MarketingActivity';
import { marketingPromoManifest } from '@/modules/MarketingPromo';
import { meetingRoomManifest } from '@/modules/MeetingRoom';
import { onDutyRequestManifest } from '@/modules/OnDutyRequest';
import { priceApprovalManifest } from '@/modules/PriceApproval';
import { productBorrowingManifest } from '@/modules/ProductBorrowing';
import { purchaseRequestManifest } from '@/modules/PurchaseRequest';
import { registerCustomerManifest } from '@/modules/RegisterCustomer';
import { stockPenjualanManifest } from '@/modules/StockPenjualan';
import type { ModuleManifest } from '@/shared/types/module';

// The one place that knows which business modules exist. To add a module:
// 1. export its manifest from the module's index.ts and list it here;
// 2. add its route files under src/app/(app)/<module>/ (thin re-exports of its screens).
export const moduleManifests: ModuleManifest[] = [
  priceApprovalManifest,
  purchaseRequestManifest,
  onDutyRequestManifest,
  registerCustomerManifest,
  stockPenjualanManifest,
  laporanPenjualanManifest,
  marketingActivityManifest,
  marketingPromoManifest,
  meetingRoomManifest,
  productBorrowingManifest,
];
