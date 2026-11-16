// Public interface of the MarketingActivity module. Other code imports only from here.
export { marketingActivityManifest } from './manifest';
export { MarketingActivityLayout } from './navigation/marketing-activity-layout';
export { MarketingActivityDetailScreen } from './screens/marketing-activity-detail-screen';
export { MarketingActivityListScreen } from './screens/marketing-activity-list-screen';
export type {
  MarketingActivityKind,
  MarketingActivityListItem,
  MarketingActivityStatus,
} from './types';
