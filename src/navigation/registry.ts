import { priceApprovalManifest } from '@/modules/PriceApproval';
import type { ModuleManifest } from '@/shared/types/module';

// The one place that knows which business modules exist. To add a module:
// 1. export its manifest from the module's index.ts and list it here;
// 2. add its route files under src/app/(app)/<module>/ (thin re-exports of its screens).
export const moduleManifests: ModuleManifest[] = [priceApprovalManifest];
