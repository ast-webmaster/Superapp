import type { ModuleManifest } from '@/shared/types/module';

import { flows } from './flows';
import { gimmickRoutes } from './navigation/routes';

// Two tiles, one code base: each flow has its own permissions, slug and routes. The slug is what
// the backend notifies with, so an inbox item or push opens the right flow.
export const marketingInboundManifest: ModuleManifest = {
  id: flows.inbound.slug,
  title: flows.inbound.title,
  description: flows.inbound.description,
  route: gimmickRoutes.list('inbound'),
  detailRoute: (docUuid) => gimmickRoutes.detail('inbound', docUuid),
  icon: 'download',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: [
    'read_marketing_inbound_transactions',
    'read_all_marketing_inbound_transactions',
    'create_marketing_inbound_transactions',
    'approve_marketing_inbound_transactions',
  ],
};

export const marketingRequestManifest: ModuleManifest = {
  id: flows.request.slug,
  title: flows.request.title,
  description: flows.request.description,
  route: gimmickRoutes.list('request'),
  detailRoute: (docUuid) => gimmickRoutes.detail('request', docUuid),
  icon: 'send',
  permission: [
    'read_marketing_request_transactions',
    'create_marketing_request_transactions',
    'approve_marketing_request_transactions',
    'processed_marketing_request_transactions',
    'received_marketing_request_transactions',
  ],
};
