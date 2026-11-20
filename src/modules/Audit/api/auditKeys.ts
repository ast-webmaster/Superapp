import type { AuditListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id. Everything that
 * belongs to one card sits under `detail(uuid)`, so `detail(uuid)` refreshes the card and all
 * its parts at once.
 */
export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: AuditListFilters, search: string) =>
    [...auditKeys.lists(), filters, search] as const,
  details: () => [...auditKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...auditKeys.details(), uuid] as const,
  part: (
    uuid: string,
    part: 'checklists' | 'attachments' | 'programs' | 'findings' | 'approvals',
  ) => [...auditKeys.detail(uuid), part] as const,
  actionCount: () => [...auditKeys.all, 'action-count'] as const,
};
