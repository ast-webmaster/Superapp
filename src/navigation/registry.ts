import { auditManifest } from '@/modules/Audit';
import { dataCustomerManifest } from '@/modules/DataCustomer';
import { dataProductManifest } from '@/modules/DataProduct';
import { laporanPenjualanManifest } from '@/modules/LaporanPenjualan';
import { marketingActivityManifest } from '@/modules/MarketingActivity';
import { marketingInboundManifest, marketingRequestManifest } from '@/modules/MarketingGimmick';
import { marketingPromoManifest } from '@/modules/MarketingPromo';
import { meetingRoomManifest } from '@/modules/MeetingRoom';
import { onDutyRequestManifest } from '@/modules/OnDutyRequest';
import { priceApprovalManifest } from '@/modules/PriceApproval';
import { productBorrowingManifest } from '@/modules/ProductBorrowing';
import { purchaseRequestManifest } from '@/modules/PurchaseRequest';
import { registerCustomerManifest } from '@/modules/RegisterCustomer';
import { salesInventoryAnalysisManifest } from '@/modules/SalesInventoryAnalysis';
import { stockGimmickManifest } from '@/modules/StockGimmick';
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
  stockGimmickManifest,
  laporanPenjualanManifest,
  marketingActivityManifest,
  marketingPromoManifest,
  meetingRoomManifest,
  productBorrowingManifest,
  dataProductManifest,
  dataCustomerManifest,
  auditManifest,
  salesInventoryAnalysisManifest,
  marketingInboundManifest,
  marketingRequestManifest,
];
