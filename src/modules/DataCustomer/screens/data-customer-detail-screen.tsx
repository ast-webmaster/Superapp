import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import {
  AddressSection,
  BusinessSection,
  ContactSection,
  InfoSection,
  LockedAlert,
  OwnerSection,
  PicSection,
  SummarySection,
} from '../components/customer-detail-sections';
import { CustomerDetailSkeleton } from '../components/customer-skeletons';
import { QueryStatus } from '../components/query-status';
import { useDataCustomer } from '../hooks/use-data-customer';

export function DataCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useDataCustomer(id);

  if (data === undefined) {
    return (
      <Screen>
        {error || fetchStatus === 'paused' ? (
          <QueryStatus
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <CustomerDetailSkeleton />
        )}
      </Screen>
    );
  }

  const syncedAt = formatSyncedAt(dataUpdatedAt);

  return (
    <Screen>
      {/* Under the native stack header: no top inset, only the standard gap. */}
      <ScrollView
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          paddingBottom: bottom + sizes.screenTopGap,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }>
        {!online ? (
          <Alert tone="warning" message={`You are offline. Showing data from ${syncedAt}.`} />
        ) : error ? (
          <Alert tone="warning" message={`Could not refresh. Showing data from ${syncedAt}.`} />
        ) : null}
        <LockedAlert detail={data} />
        <SummarySection detail={data} />
        <ContactSection detail={data} />
        <PicSection detail={data} />
        <AddressSection detail={data} />
        <BusinessSection detail={data} />
        <OwnerSection detail={data} />
        <InfoSection detail={data} />
      </ScrollView>
    </Screen>
  );
}
