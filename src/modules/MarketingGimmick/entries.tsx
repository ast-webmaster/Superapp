// The screens and layouts the route files re-export, one set per flow. A route file stays a thin
// re-export (see AGENTS.md), so the flow is fixed here instead of in `src/app`.
import { GimmickLayout } from './navigation/gimmick-layout';
import { GimmickCreateScreen } from './screens/gimmick-create-screen';
import { GimmickDetailScreen } from './screens/gimmick-detail-screen';
import { GimmickListScreen } from './screens/gimmick-list-screen';

export const MarketingInboundLayout = () => <GimmickLayout flow="inbound" />;
export const MarketingInboundListScreen = () => <GimmickListScreen flow="inbound" />;
export const MarketingInboundDetailScreen = () => <GimmickDetailScreen flow="inbound" />;
export const MarketingInboundCreateScreen = () => <GimmickCreateScreen flow="inbound" />;

export const MarketingRequestLayout = () => <GimmickLayout flow="request" />;
export const MarketingRequestListScreen = () => <GimmickListScreen flow="request" />;
export const MarketingRequestDetailScreen = () => <GimmickDetailScreen flow="request" />;
export const MarketingRequestCreateScreen = () => <GimmickCreateScreen flow="request" />;
