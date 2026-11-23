import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { sizes } from '@/shared/theme/tokens';
import {
  ActionBar,
  Alert,
  AppText,
  Button,
  FieldLabel,
  focusRing,
  Icon,
  Screen,
  TextField,
} from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { AttendeesField } from '../components/attendees-field';
import { DaySheet } from '../components/day-sheet';
import { QueryStatus } from '../components/query-status';
import { RoomPicker } from '../components/room-picker';
import { SlotPicker } from '../components/slot-picker';
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  emptyDraft,
  errorsFromServer,
  needsSpecialRequest,
  toRequestBody,
  validateDraft,
  type Errors,
} from '../create/draft';
import { isIsoDay, todayIso } from '../create/dates';
import { takenSlots } from '../create/slots';
import { useCreateBooking } from '../hooks/use-create-booking';
import { useMeetingRooms } from '../hooks/use-meeting-rooms';
import { meetingRoomRoutes } from '../navigation/routes';
import type { BookingDraft } from '../types';

/** Book a room for one day. `room` and `date` in the route start the form on that room and day. */
export function MeetingRoomCreateScreen() {
  const params = useLocalSearchParams<{ room?: string; date?: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    ...emptyDraft,
    roomUuid: params.room ?? null,
    date: isIsoDay(params.date) ? params.date : todayIso(),
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [choosingDate, setChoosingDate] = useState(false);
  const booking = useCreateBooking();
  const rooms = useMeetingRooms(draft.date);

  const room = rooms.data?.rooms.find((item) => item.uuid === draft.roomUuid) ?? null;
  const allSlots = useMemo(() => rooms.data?.meta.slots ?? [], [rooms.data]);
  const taken = useMemo(() => takenSlots(allSlots, room?.bookings ?? []), [allSlots, room]);

  const change = (patch: Partial<BookingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      // A field's message goes away as soon as the person edits it.
      if ('roomUuid' in patch) delete next.room;
      if ('date' in patch) delete next.date;
      if ('slots' in patch) delete next.slots;
      if ('title' in patch) delete next.title;
      if ('description' in patch) delete next.description;
      if ('attendees' in patch) delete next.attendees;
      if ('specialRequest' in patch) delete next.specialRequest;
      return next;
    });
  };

  if (rooms.data === undefined && (rooms.error || rooms.fetchStatus === 'paused')) {
    return (
      <Screen>
        <QueryStatus
          subject="the rooms"
          error={rooms.error}
          offline={rooms.fetchStatus === 'paused'}
          onRetry={() => void rooms.refetch()}
        />
      </Screen>
    );
  }

  const submit = () => {
    if (booking.isPending) return;
    const found = validateDraft(draft, { roomName: room?.name ?? null, allSlots, taken });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    booking.mutate(toRequestBody(draft, room?.name ?? null), {
      onSuccess: (detail) => router.replace(meetingRoomRoutes.detail(detail.id) as Href),
      onError: (error) => {
        const { code, fieldErrors } = toAppError(error);
        if (code === 'validation') setErrors(errorsFromServer(fieldErrors));
        // The slots just refreshed: a taken one is no longer selectable, so the pick starts over.
        if (code === 'validation' && fieldErrors?.time_slot) setDraft((d) => ({ ...d, slots: [] }));
      },
    });
  };

  const failure = booking.error ? toAppError(booking.error) : undefined;
  // Field errors already sit on their fields; the alert is for what no field can show.
  const formError =
    failure && (failure.code !== 'validation' || Object.keys(errors).length === 0)
      ? failure.code === 'network' || failure.code === 'timeout' || failure.code === 'server'
        ? 'Could not confirm the booking. Check the room list for your booking before you try again.'
        : failure.code === 'forbidden'
          ? 'Your account cannot book rooms.'
          : failure.message
      : null;

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{ paddingTop: sizes.screenTopGap, paddingBottom: bottom + 24 }}>
        {formError ? <Alert tone="danger" message={formError} onDismiss={booking.reset} /> : null}

        <View className="gap-4 rounded-xl border border-border bg-surface p-4">
          <View className="gap-2">
            <FieldLabel required>Room</FieldLabel>
            {rooms.data === undefined ? (
              <AppText variant="caption" tone="muted">
                Loading rooms…
              </AppText>
            ) : (
              <RoomPicker
                rooms={rooms.data.rooms}
                value={draft.roomUuid ?? ''}
                // Another room has other free times, so the chosen ones no longer apply.
                onChange={(roomUuid) => change({ roomUuid, slots: [] })}
              />
            )}
            {errors.room ? (
              <AppText variant="caption" tone="danger" aria-live="polite">
                {errors.room}
              </AppText>
            ) : null}
            {room && (room.location || room.capacity) ? (
              <AppText variant="caption" tone="muted">
                {[room.location, room.capacity ? `${room.capacity} seats` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            ) : null}
          </View>

          <View className="gap-1">
            <FieldLabel required>Date</FieldLabel>
            <Pressable
              role="button"
              aria-label={`Date, ${formatDate(draft.date)}`}
              onPress={() => setChoosingDate(true)}
              className={clsx(
                'min-h-control flex-row items-center gap-3 rounded-lg border-2 bg-surface px-4',
                errors.date ? 'border-danger' : 'border-border',
                focusRing,
              )}>
              <AppText className="min-w-0 flex-1">{formatDate(draft.date)}</AppText>
              <Icon name="calendar" color="ink-muted" />
            </Pressable>
            {errors.date ? (
              <AppText variant="caption" tone="danger" aria-live="polite">
                {errors.date}
              </AppText>
            ) : null}
          </View>
          <DaySheet
            visible={choosingDate}
            title="Choose a date"
            value={draft.date}
            // Another day has other bookings, so the chosen times no longer apply.
            onChange={(date) => change({ date, slots: [] })}
            onClose={() => setChoosingDate(false)}
          />

          <SlotPicker
            slots={allSlots}
            taken={taken}
            selected={draft.slots}
            onChange={(slots) => change({ slots })}
            loading={rooms.data === undefined}
            hint={draft.roomUuid ? undefined : 'Choose a room to see its free times.'}
            error={errors.slots}
          />
        </View>

        <View className="gap-4 rounded-xl border border-border bg-surface p-4">
          <TextField
            label="Title"
            required
            value={draft.title}
            onChangeText={(title) => change({ title })}
            error={errors.title}
            maxLength={TITLE_MAX}
            returnKeyType="next"
          />
          <TextField
            label="Description"
            help="Optional. The agenda or what to prepare."
            value={draft.description}
            onChangeText={(description) => change({ description })}
            error={errors.description}
            maxLength={DESCRIPTION_MAX}
            multiline
            textAlignVertical="top"
            className="min-h-24"
          />
          {needsSpecialRequest(room?.name) ? (
            <TextField
              label="Special request"
              required
              help="Catering, seating or equipment this room needs."
              value={draft.specialRequest}
              onChangeText={(specialRequest) => change({ specialRequest })}
              error={errors.specialRequest}
              multiline
              textAlignVertical="top"
              className="min-h-20"
            />
          ) : null}
          <AttendeesField
            value={draft.attendees}
            onChange={(attendees) => change({ attendees })}
            error={errors.attendees}
          />
        </View>
      </ScrollView>
      <ActionBar>
        <Button
          block
          loading={booking.isPending}
          disabled={!online || booking.isPending}
          onPress={submit}>
          Book room
        </Button>
        {!online ? (
          <AppText variant="caption" tone="muted">
            Connect to the internet to book a room.
          </AppText>
        ) : null}
      </ActionBar>
    </Screen>
  );
}
