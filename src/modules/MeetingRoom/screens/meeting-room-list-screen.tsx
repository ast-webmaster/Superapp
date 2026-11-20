import { clsx } from 'clsx';
import { router, Stack, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors } from '@/shared/theme/tokens';
import { Alert, Button, EmptyState, Fab, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { DayBar } from '../components/day-bar';
import { RoomListSkeleton } from '../components/meeting-room-skeletons';
import { QueryStatus } from '../components/query-status';
import { RoomCard } from '../components/room-card';
import { todayIso } from '../create/dates';
import { useMeetingRooms } from '../hooks/use-meeting-rooms';
import { meetingRoomRoutes } from '../navigation/routes';

/** The rooms and who has them on one day. Opens on today. */
export function MeetingRoomListScreen() {
  const [date, setDate] = useState(todayIso);
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useMeetingRooms(date);

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () =>
            date !== todayIso() ? (
              <Button size="sm" variant="soft" onPress={() => setDate(todayIso())}>
                Today
              </Button>
            ) : null,
        }}
      />
      <View className="pb-4 pt-2">
        <DayBar value={date} onChange={setDate} />
      </View>
      {data === undefined ? (
        error || fetchStatus === 'paused' ? (
          <QueryStatus
            subject="the rooms"
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <RoomListSkeleton />
        )
      ) : (
        <FlatList
          data={data.rooms}
          keyExtractor={(room) => room.uuid}
          renderItem={({ item }) => <RoomCard room={item} />}
          ListHeaderComponent={
            !online ? (
              <Alert
                tone="warning"
                message={`You are offline. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
              />
            ) : error ? (
              <Alert
                tone="warning"
                message={`Could not refresh. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
              />
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="building"
              title="No rooms yet"
              description="There are no meeting rooms to book."
            />
          }
          contentContainerClassName={clsx('gap-4 px-5 pb-28', data.rooms.length === 0 && 'grow')}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        />
      )}
      <Fab
        label="Book a room"
        onPress={() => router.push(meetingRoomRoutes.create({ date }) as Href)}
      />
    </Screen>
  );
}
