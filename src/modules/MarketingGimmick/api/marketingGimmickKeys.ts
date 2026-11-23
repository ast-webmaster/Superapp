import { flows } from '../flows';
import type { GimmickFlow, GimmickListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the flow's manifest id, so the two
 * flows and every other module stay apart, and `all` / `lists()` / `details()` invalidate a whole
 * family of one flow.
 */
export const marketingGimmickKeys = {
  all: (flow: GimmickFlow) => [flows[flow].slug] as const,
  lists: (flow: GimmickFlow) => [...marketingGimmickKeys.all(flow), 'list'] as const,
  list: (flow: GimmickFlow, filters: GimmickListFilters, search: string) =>
    [...marketingGimmickKeys.lists(flow), filters, search] as const,
  details: (flow: GimmickFlow) => [...marketingGimmickKeys.all(flow), 'detail'] as const,
  detail: (flow: GimmickFlow, uuid: string) =>
    [...marketingGimmickKeys.details(flow), uuid] as const,
  /** The pickers of the form. They are never invalidated by an action. */
  lookups: (flow: GimmickFlow) => [...marketingGimmickKeys.all(flow), 'lookup'] as const,
  offices: (flow: GimmickFlow) => [...marketingGimmickKeys.lookups(flow), 'offices'] as const,
  items: (flow: GimmickFlow, search: string) =>
    [...marketingGimmickKeys.lookups(flow), 'items', search] as const,
};
