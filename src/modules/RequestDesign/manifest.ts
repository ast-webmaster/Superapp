import type { ModuleManifest } from '@/shared/types/module';

import { requestDesignRoutes } from './navigation/routes';

export const requestDesignManifest: ModuleManifest = {
  id: 'request-design',
  title: 'Request Design',
  description: 'Ask the graphic designer for images and videos, and follow the work',
  route: requestDesignRoutes.list,
  detailRoute: requestDesignRoutes.detail,
  icon: 'pencil',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: [
    'create_requestdesign',
    'read_requestdesign',
    'read_all_requestdesign',
    'picked_requestdesign',
    'approved_requestdesign',
    'analytics_requestdesign',
    'analytics_all_requestdesign',
  ],
};
