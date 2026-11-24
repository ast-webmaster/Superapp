import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState, Screen } from '@/shared/ui';

import { CaptureView } from '../components/capture-view';
import { QueryStatus } from '../components/query-status';
import { useCheckIn } from '../hooks/use-check-in';
import { useSalesVisitationOptions } from '../hooks/use-options';
import { useSalesVisitation } from '../hooks/use-sales-visitation';
import { salesVisitationRoutes } from '../navigation/routes';

/** Arrival on site: the camera photo and the position, judged by the server. */
export function SalesVisitationCheckInScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const visit = useSalesVisitation(uuid);
  const options = useSalesVisitationOptions();
  const checkIn = useCheckIn(uuid);

  if (!visit.data || !options.data) {
    const waiting = !visit.data ? visit : options;
    return (
      <Screen>
        <QueryStatus
          subject="the visit"
          error={waiting.error}
          offline={waiting.fetchStatus === 'paused'}
          onRetry={() => void waiting.refetch()}
        />
      </Screen>
    );
  }
  // Check-in only opens on the day of the visit, which the server decides.
  if (!visit.data.allowed_actions.includes('check_in') && !checkIn.isSuccess) {
    return (
      <Screen>
        <EmptyState
          icon="pin"
          title="Check-in is not available"
          description="It opens on the day of the visit, for the person who planned it."
        />
      </Screen>
    );
  }

  return (
    <CaptureView
      mode="in"
      visit={visit.data}
      settings={options.data.settings}
      error={checkIn.error}
      pending={checkIn.isPending}
      onSubmit={(fix, photo) =>
        checkIn
          .mutateAsync({ fix, photo })
          .then(() => router.dismissTo(salesVisitationRoutes.detail(uuid) as never))
      }
    />
  );
}
