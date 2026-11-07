import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { colors, sizes } from '@/shared/theme/tokens';
import {
  Alert,
  AppText,
  Badge,
  Button,
  EmptyState,
  ListGroup,
  ListRow,
  Loading,
  Screen,
} from '@/shared/ui';

import { ApprovalActions } from '../components/approval-actions';
import { formatMoney, formatSyncedAt } from '../components/format';
import { sentenceCase, statusBadge, stepBadge } from '../components/status';
import { useIsOnline } from '../hooks/use-is-online';
import { usePriceApproval } from '../hooks/use-price-approval';
import type { PriceApprovalDetail } from '../types';

export function PriceApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = usePriceApproval(id);

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
              icon="clipboard"
              title="Request not found"
              description="It may have been removed, or you no longer have access to it."
            />
          ) : (
            <EmptyState
              icon="alert"
              title="Could not load this request"
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
          <Loading label="Loading request" className="flex-1" />
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
        <Summary detail={data} syncedAt={syncedAt} />
        <Facts detail={data} />
        <Lines detail={data} />
        <Steps detail={data} />
        <ApprovalActions detail={data} online={online} />
      </ScrollView>
    </Screen>
  );
}

function Summary({ detail, syncedAt }: { detail: PriceApprovalDetail; syncedAt: string }) {
  return (
    <View className="gap-2 rounded-xl bg-surface p-4 shadow-card">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="module-title" role="heading" className="min-w-0 flex-1">
          {detail.pa_no}
        </AppText>
        <Badge {...statusBadge(detail.status)} />
      </View>
      <AppText>{detail.customer_name ?? detail.customer_id ?? '-'}</AppText>
      <AppText variant="caption" tone="muted">
        {`${detail.request_by_name ?? detail.request_by} · ${detail.pa_date} · Updated ${syncedAt}`}
      </AppText>
    </View>
  );
}

function Facts({ detail }: { detail: PriceApprovalDetail }) {
  const rows: [string, string | null][] = [
    ['Grand total', formatMoney(detail.grand_total)],
    ['Order date', detail.order_date],
    ['Payment', detail.payment_type],
    ['Category', detail.category],
    ['Shipment', detail.shipment],
    ['PO / SC', detail.po_sc],
    ['Assembly', detail.assembly_no],
  ];

  return (
    <>
      <ListGroup>
        {rows
          .filter((row): row is [string, string] => Boolean(row[1]))
          .map(([label, value]) => (
            <ListRow key={label} label={label} value={value} />
          ))}
      </ListGroup>
      {detail.remarks || detail.shipping_note ? (
        <View className="gap-2 rounded-xl bg-surface p-4 shadow-card">
          {detail.remarks ? <Note label="Remarks" text={detail.remarks} /> : null}
          {detail.shipping_note ? <Note label="Shipping note" text={detail.shipping_note} /> : null}
        </View>
      ) : null}
    </>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <View className="gap-1">
      <AppText variant="label">{label}</AppText>
      <AppText>{text}</AppText>
    </View>
  );
}

function Lines({ detail }: { detail: PriceApprovalDetail }) {
  if (detail.details.length === 0) return null;

  return (
    <View className="gap-2">
      <AppText variant="title" role="heading">
        Items
      </AppText>
      <ListGroup>
        {detail.details.map((line, index) => (
          <View key={`${line.sku_no}-${index}`} className="gap-1 py-3">
            <View className="flex-row justify-between gap-3">
              <AppText variant="body-strong" className="min-w-0 flex-1">
                {line.sku_no}
              </AppText>
              <AppText variant="body-strong">{formatMoney(line.amount)}</AppText>
            </View>
            <AppText variant="caption" tone="muted">
              {`${line.qty} × ${formatMoney(line.price)}`}
              {line.price_after_discount !== line.price
                ? ` · After discount ${formatMoney(line.price_after_discount)}`
                : ''}
            </AppText>
          </View>
        ))}
      </ListGroup>
    </View>
  );
}

function Steps({ detail }: { detail: PriceApprovalDetail }) {
  if (detail.approvements.length === 0) return null;

  return (
    <View className="gap-2">
      <AppText variant="title" role="heading">
        Approval history
      </AppText>
      <ListGroup>
        {detail.approvements.map((step, index) => (
          <View key={`${step.tier}-${index}`} className="gap-1 py-3">
            <View className="flex-row items-start justify-between gap-3">
              <AppText variant="body-strong" className="min-w-0 flex-1">
                {sentenceCase(step.tier)}
              </AppText>
              <Badge {...stepBadge(step.status)} />
            </View>
            <AppText variant="caption" tone="muted">
              {[step.user_name, step.action_at].filter(Boolean).join(' · ') || 'Not acted on yet'}
            </AppText>
            {step.remarks ? <AppText>{step.remarks}</AppText> : null}
          </View>
        ))}
      </ListGroup>
    </View>
  );
}
