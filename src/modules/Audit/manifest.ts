import type { ModuleManifest } from '@/shared/types/module';

import { auditRoutes } from './navigation/routes';

export const auditManifest: ModuleManifest = {
  id: 'audit',
  title: 'Audit',
  description: 'Follow up internal audits and their findings',
  route: auditRoutes.list,
  detailRoute: auditRoutes.detail,
  icon: 'eye',
  // The list answers 403 without one of these, the same either-or the backend middleware uses.
  permission: ['read_audit', 'read_all_audit', 'approve_audit'],
};
