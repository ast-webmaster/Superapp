import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, AppText, Badge, Screen } from '@/shared/ui';
import { formatDate, formatDateTime, formatSyncedAt } from '@/shared/utils/format';

import { CancelAction, hasCancelAction } from '../components/cancel-action';
import { BookingDetailSkeleton } from '../components/meeting-room-skeletons';
import { QueryStatus } from '../components/query-status';
import { statusBadge } from '../components/status';
import { durationLabel } from '../create/slots';
import { useMeetingRoomBooking } from '../hooks/use-meeting-room-booking';
import type { MeetingRoomBookingDetail } from '../types';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      <AppText variant="module-title" role="heading">
        {title}
      </AppText>
      {children}
    </View>
  );
}

/** A label over its value, so a long value (a sentence, an email) wraps instead of being cut. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

function Summary({ detail }: { detail: MeetingRoomBookingDetail }) {
  const place = [detail.room.name, detail.room.location].filter(Boolean).join(' · ');

  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="module-title" role="heading" className="min-w-0 flex-1">
          {detail.title}
        </AppText>
        <Badge {...statusBadge(detail.status)} />
      </View>
      <View className="gap-1">
        <AppText variant="caption-strong">
          {`${formatDate(detail.date)} · ${detail.start_time} - ${detail.end_time}`}
        </AppText>
        <AppText variant="caption" tone="muted">
          {`${durationLabel(detail.slots.length)}${place ? ` · ${place}` : ''}`}
        </AppText>
      </View>
    </View>
  );
}

export function MeetingRoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } =
    useMeetingRoomBooking(bookingId);

  if (data === undefined) {
    return (
      <Screen>
        {error || fetchStatus === 'paused' ? (
          <QueryStatus
            subject="this booking"
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <BookingDetailSkeleton />
        )}
      </Screen>
    );
  }

  const syncedAt = formatSyncedAt(dataUpdatedAt);
  const cancelled = data.status === 'CANCELLED';

  return (
    <Screen>
      {/* Under the native stack header: no top inset, only the standard gap. */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          // The action bar owns the bottom inset when it is shown.
          paddingBottom: hasCancelAction(data) ? sizes.screenTopGap : bottom + sizes.screenTopGap,
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
        <Summary detail={data} />
        {cancelled ? (
          <Section title="Cancellation">
            {data.cancel_remarks ? <Field label="Reason" value={data.cancel_remarks} /> : null}
            {data.cancelled_by ? <Field label="Cancelled by" value={data.cancelled_by} /> : null}
            {data.cancelled_at ? (
              <Field label="Cancelled at" value={formatDateTime(data.cancelled_at.slice(0, 16))} />
            ) : null}
          </Section>
        ) : null}
        <Section title="Details">
          <Field
            label="Organizer"
            value={data.is_owner ? `${data.organizer_name} (you)` : data.organizer_name}
          />
          {data.description ? <Field label="Description" value={data.description} /> : null}
          {data.special_request ? (
            <Field label="Special request" value={data.special_request} />
          ) : null}
          {data.created_at ? (
            <Field label="Booked on" value={formatDateTime(data.created_at.slice(0, 16))} />
          ) : null}
        </Section>
        <Section title="Invited">
          {data.attendees.length > 0 ? (
            data.attendees.map((attendee) => (
              <View key={attendee.email} className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <AppText numberOfLines={1}>{attendee.name}</AppText>
                  {attendee.name !== attendee.email ? (
                    <AppText variant="label" tone="muted" numberOfLines={1}>
                      {attendee.email}
                    </AppText>
                  ) : null}
                </View>
                {attendee.is_user ? null : <Badge size="sm" label="Outside" />}
              </View>
            ))
          ) : (
            <AppText variant="caption" tone="muted">
              No one else was invited.
            </AppText>
          )}
        </Section>
      </ScrollView>
      <CancelAction detail={data} online={online} />
    </Screen>
  );
}
