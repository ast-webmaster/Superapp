import type { OnDutyRequestListFilters, TripType } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it, and `all` / `lists()` / `details()` invalidate a whole family.
 */
export const onDutyRequestKeys = {
  all: ['on-duty-request'] as const,
  lists: () => [...onDutyRequestKeys.all, 'list'] as const,
  list: (filters: OnDutyRequestListFilters, search: string) =>
    [...onDutyRequestKeys.lists(), filters, search] as const,
  details: () => [...onDutyRequestKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...onDutyRequestKeys.details(), uuid] as const,
  /** The pickers of the form. They are never invalidated by an action. */
  lookups: () => [...onDutyRequestKeys.all, 'lookup'] as const,
  options: () => [...onDutyRequestKeys.lookups(), 'options'] as const,
  destinations: (type: TripType, search: string) =>
    [...onDutyRequestKeys.lookups(), 'destinations', type, search] as const,
};
