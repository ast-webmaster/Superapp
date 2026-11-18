import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Button, EmptyState, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { ApprovalActions } from '../components/approval-actions';
import {
  ContactSection,
  CustomerSection,
  DocumentsSection,
  HistorySection,
  SummarySection,
} from '../components/register-customer-detail-sections';
import { RegisterCustomerDetailSkeleton } from '../components/register-customer-skeletons';
import { useRegisterCustomer } from '../hooks/use-register-customer';
import { useRegisterCustomerFile } from '../hooks/use-register-customer-file';

export function RegisterCustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } =
    useRegisterCustomer(id);
  const { download, pending } = useRegisterCustomerFile(id);

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  if (data === undefined) {
    return (
      <Screen>
        {error ? (
          toAppError(error).code === 'not_found' ? (
            <EmptyState
              icon="users"
              title="Registration not found"
              description="It may have been removed, or you no longer have access to it."
            />
          ) : (
            <EmptyState
              icon="alert"
              title="Could not load this registration"
              description={toAppError(error).message}>
              {retry}
            </EmptyState>
          )
        ) : fetchStatus === 'paused' ? (
          <EmptyState
            icon="alert"
            title="You are offline"
            description="Check your connection and try again.">
            {retry}
          </EmptyState>
        ) : (
          <RegisterCustomerDetailSkeleton />
        )}
      </Screen>
    );
  }

  const syncedAt = formatSyncedAt(dataUpdatedAt);

  return (
    <Screen>
      {/* Under the native stack header: no top inset, only the standard gap. */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          // The decision bar owns the bottom inset when it is shown.
          paddingBottom:
            data.allowed_actions.length > 0 ? sizes.screenTopGap : bottom + sizes.screenTopGap,
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
        <SummarySection detail={data} />
        <CustomerSection detail={data} />
        <ContactSection detail={data} />
        <DocumentsSection detail={data} pending={pending} onDownload={download} />
        <HistorySection detail={data} />
      </ScrollView>
      <ApprovalActions detail={data} online={online} />
    </Screen>
  );
}
