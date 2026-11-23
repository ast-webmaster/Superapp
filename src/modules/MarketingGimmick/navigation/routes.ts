import { flows } from '../flows';
import type { GimmickFlow } from '../types';

// Route paths this module owns. The matching files live in src/app/(app)/marketing-inbound/ and
// src/app/(app)/marketing-request/; each flow's path is its API slug.
export const gimmickRoutes = {
  list: (flow: GimmickFlow) => `/${flows[flow].slug}`,
  create: (flow: GimmickFlow) => `/${flows[flow].slug}/new`,
  detail: (flow: GimmickFlow, uuid: string) => `/${flows[flow].slug}/${uuid}`,
} as const;
