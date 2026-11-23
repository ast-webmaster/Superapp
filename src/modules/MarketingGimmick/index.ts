// Public interface of the MarketingGimmick module. Other code imports only from here.
export {
  MarketingInboundCreateScreen,
  MarketingInboundDetailScreen,
  MarketingInboundLayout,
  MarketingInboundListScreen,
  MarketingRequestCreateScreen,
  MarketingRequestDetailScreen,
  MarketingRequestLayout,
  MarketingRequestListScreen,
} from './entries';
export { marketingInboundManifest, marketingRequestManifest } from './manifest';
export type { GimmickFlow, GimmickListItem } from './types';
