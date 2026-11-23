import { toAppError } from '@/core/errors';
import { ActionBar, Alert, AppText, Button, useConfirm, type AlertTone } from '@/shared/ui';

import { useCancelBooking } from '../hooks/use-cancel-booking';
import type { MeetingRoomBookingDetail } from '../types';

/** The server's limits for the reason (`remarks` is 6 to 1000 characters). */
const REASON_MIN_LENGTH = 6;
const REASON_MAX_LENGTH = 1000;

export interface CancelActionProps {
  detail: MeetingRoomBookingDetail;
  online: boolean;
}

/** True when the bar has something to show, so the screen can leave room for it. */
export function hasCancelAction(detail: MeetingRoomBookingDetail) {
  return detail.can_cancel;
}

/**
 * The bar pinned to the bottom of the detail: cancel, only when the server says this user may,
 * and the outcome of the last try (it stays after the button goes, since a cancelled booking
 * offers none). The reason is asked in the confirm dialog.
 */
export function CancelAction({ detail, online }: CancelActionProps) {
  const cancel = useCancelBooking(detail.id);
  const confirm = useConfirm();

  const failure = cancel.error ? toAppError(cancel.error) : undefined;
  const outcome: { tone: AlertTone; message: string } | undefined = cancel.isSuccess
    ? { tone: 'success', message: 'Booking cancelled. The time is free again.' }
    : failure
      ? failure.code === 'conflict'
        ? {
            tone: 'warning',
            message: 'This booking was already cancelled or has ended. Showing the latest version.',
          }
        : failure.code === 'network' || failure.code === 'timeout' || failure.code === 'server'
          ? {
              tone: 'danger',
              message: 'Could not confirm the cancellation. Check the status before you try again.',
            }
          : { tone: 'danger', message: failure.message }
      : undefined;

  if (!hasCancelAction(detail) && !outcome) return null;

  const run = () => {
    if (cancel.isPending) return;
    confirm({
      title: 'Cancel this booking?',
      message: 'The time is freed for others, and the invitation is removed from calendars.',
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep it',
      icon: 'x',
      destructive: true,
      reason: {
        label: 'Reason',
        required: true,
        minLength: REASON_MIN_LENGTH,
        maxLength: REASON_MAX_LENGTH,
        requiredMessage: `Enter a reason of at least ${REASON_MIN_LENGTH} characters.`,
      },
      success: { title: 'Booking cancelled' },
      onConfirm: (remarks) => cancel.mutateAsync(remarks),
    });
  };

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={cancel.reset} />
      ) : null}
      {hasCancelAction(detail) ? (
        <>
          <Button
            block
            variant="secondary"
            loading={cancel.isPending}
            disabled={!online || cancel.isPending}
            onPress={run}>
            Cancel booking
          </Button>
          {!online ? (
            <AppText variant="caption" tone="muted">
              Connect to the internet to cancel this booking.
            </AppText>
          ) : null}
        </>
      ) : null}
    </ActionBar>
  );
}
