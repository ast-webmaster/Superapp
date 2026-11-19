import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, Button, focusRing, Icon } from '@/shared/ui';

import { meetingRoomRoutes } from '../navigation/routes';
import type { MeetingRoom, MeetingRoomBookingSummary } from '../types';

function BookingRow({ booking }: { booking: MeetingRoomBookingSummary }) {
  return (
    <Pressable
      role="button"
      aria-label={`${booking.title}, ${booking.start_time} to ${booking.end_time}, by ${booking.organizer_name}`}
      onPress={() => router.push(meetingRoomRoutes.detail(booking.id) as Href)}
      className={clsx(
        'min-h-touch flex-row items-center gap-3 rounded-lg bg-surface-gray px-3 py-2 active:bg-border',
        focusRing,
      )}>
      <View className="w-24">
        <AppText variant="caption-strong">{`${booking.start_time} - ${booking.end_time}`}</AppText>
      </View>
      <View className="min-w-0 flex-1">
        <AppText variant="caption-strong" numberOfLines={1}>
          {booking.title}
        </AppText>
        <AppText variant="label" tone="muted" numberOfLines={1}>
          {booking.organizer_name}
        </AppText>
      </View>
      {booking.is_owner ? <Badge size="sm" tone="info" label="You" /> : null}
      <Icon name="chevron-right" color="ink-muted" />
    </Pressable>
  );
}

export interface RoomCardProps {
  room: MeetingRoom;
  /** YYYY-MM-DD, the day the bookings belong to. */
  date: string;
}

/** One room: what it offers, who has it today, and a way to book it. */
export function RoomCard({ room, date }: RoomCardProps) {
  return (
    <View className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <AppText variant="module-title" className="min-w-0 flex-1">
            {room.name}
          </AppText>
          {room.capacity ? <Badge size="sm" icon="users" label={`${room.capacity} seats`} /> : null}
        </View>
        {room.location ? (
          <AppText variant="caption" tone="muted">
            {room.location}
          </AppText>
        ) : null}
        {room.facilities.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {room.facilities.map((facility) => (
              <Badge key={facility} size="sm" label={facility} />
            ))}
          </View>
        ) : null}
      </View>
      <View role="separator" className="h-px bg-border" />
      {room.bookings.length > 0 ? (
        <View className="gap-2">
          {room.bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </View>
      ) : (
        <AppText variant="caption" tone="muted">
          No bookings on this day.
        </AppText>
      )}
      <Button
        variant="soft"
        block
        iconLeft="plus"
        onPress={() => router.push(meetingRoomRoutes.create({ room: room.uuid, date }) as Href)}>
        {`Book ${room.name}`}
      </Button>
    </View>
  );
}
