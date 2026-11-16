import type { ModuleManifest } from '@/shared/types/module';

import { COMBINATION_SLUG, marketingActivityRoutes } from './navigation/routes';

export const marketingActivityManifest: ModuleManifest = {
  id: 'marketing-activity',
  title: 'Marketing Activity',
  description: 'Review and approve marketing activities',
  route: marketingActivityRoutes.list,
  // Combination documents are notified under their own slug but open in this module.
  aliases: [COMBINATION_SLUG],
  detailRoute: (docUuid, slug) =>
    marketingActivityRoutes.detail(docUuid, slug === COMBINATION_SLUG ? 'combination' : 'single'),
  icon: 'calendar',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: [
    'read_marketing_activity_marcom',
    'read_marketing_activity_marcom_asusnb',
    'read_only_all_marketing_activity',
  ],
};
