import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState, Screen, useConfirm } from '@/shared/ui';

import { acquireFix } from '../capture/gps';
import { CaptureView } from '../components/capture-view';
import { QueryStatus } from '../components/query-status';
import { noteBadge } from '../components/status';
import { useCheckOut, useCheckOutPreview } from '../hooks/use-check-out';
import { useSalesVisitationOptions } from '../hooks/use-options';
import { useSalesVisitation } from '../hooks/use-sales-visitation';
import { salesVisitationRoutes } from '../navigation/routes';
import type { CheckOutPreview } from '../types';

/** What the server says it would record, in words for the confirm dialog. */
function previewMessage(preview: CheckOutPreview): string {
  const lines = [noteBadge(preview.note).label, `Time on site: ${preview.onsite_minutes} min`];
  if (preview.distance_m !== null) {
    lines.push(`Distance from the planned point: ${Math.round(preview.distance_m)} m`);
  } else if (preview.require_gps_radius) {
    lines.push('Your position could not be used, so you count as outside the radius.');
  }
  lines.push('The final rating is decided when you confirm.');
  return lines.join('\n');
}

/**
 * Departure: the camera photo and the position. The server first says what it would record (a
 * preview that saves nothing), the user confirms, then the position is read again so the reading
 * the server judges is fresh however long the dialog stayed open.
 */
export function SalesVisitationCheckOutScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const confirm = useConfirm();
  const visit = useSalesVisitation(uuid);
  const options = useSalesVisitationOptions();
  const preview = useCheckOutPreview(uuid);
  const checkOut = useCheckOut(uuid);

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
  if (!visit.data.allowed_actions.includes('check_out') && !checkOut.isSuccess) {
    return (
      <Screen>
        <EmptyState
          icon="pin"
          title="Check-out is not available"
          description="You can check out of a visit you have checked in to."
        />
      </Screen>
    );
  }

  const { settings } = options.data;

  return (
    <CaptureView
      mode="out"
      visit={visit.data}
      settings={settings}
      error={checkOut.error ?? preview.error}
      pending={preview.isPending || checkOut.isPending}
      onSubmit={async (fix, photo) => {
        const result = await preview.mutateAsync(fix);
        confirm({
          title: 'Check out now?',
          message: previewMessage(result),
          confirmLabel: 'Check out',
          icon: 'check',
          success: { title: 'Checked out' },
          onConfirm: async () => {
            const fresh = await acquireFix(settings.require_gps_radius);
            await checkOut.mutateAsync({ fix: fresh, photo });
            router.dismissTo(salesVisitationRoutes.detail(uuid) as never);
          },
        });
      }}
    />
  );
}
