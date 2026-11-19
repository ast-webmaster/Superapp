import { useState } from 'react';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, DateRangePicker, Sheet, TextField, useToast } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { useExtendProductBorrowing } from '../hooks/use-product-borrowing-action';
import type { ProductBorrowingDetail } from '../types';
import { statusBadge } from './status';

/** The server's limits on the reason. */
const REASON_MIN = 6;
const REASON_MAX = 1000;

export interface ExtendSheetProps {
  detail: ProductBorrowingDetail;
  online: boolean;
  onClose: () => void;
}

/** The latest date the borrowed items are due back, so the user sees what the new date follows. */
function dueBack(detail: ProductBorrowingDetail): string | null {
  const dates = detail.items
    .filter((item) => item.status === 'BORROWED')
    .flatMap((item) => (item.estimate_return ? [item.estimate_return] : []));
  return dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null;
}

/**
 * Asks to keep the borrowed items longer: a new return date and a reason. It applies to every item
 * still borrowed. The server checks the date against each item's return date (it must be later,
 * and within 31 days of it) and answers 422 with the reason when it is not.
 */
export function ExtendSheet({ detail, online, onClose }: ExtendSheetProps) {
  const toast = useToast();
  const { mutate, isPending, error, reset } = useExtendProductBorrowing(detail.uuid);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [attempted, setAttempted] = useState(false);

  const due = dueBack(detail);
  const trimmed = reason.trim();
  const problems = {
    date: endDate === null ? 'Choose the new return date.' : undefined,
    reason: trimmed.length < REASON_MIN ? `Write at least ${REASON_MIN} characters.` : undefined,
  };
  const failure = error ? toAppError(error) : null;

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (isPending || endDate === null || trimmed.length < REASON_MIN) {
      setAttempted(true);
      return;
    }
    mutate(
      { endDate, reason: trimmed, updatedAt: detail.updated_at },
      {
        onSuccess: (updated) => {
          toast.show({
            tone: 'success',
            message: `Saved. Status is now ${statusBadge(updated.status).label}.`,
          });
          onClose();
        },
      },
    );
  };

  return (
    <Sheet
      visible
      fullHeight
      title="Extend borrowing"
      onClose={close}
      footer={
        <Button block loading={isPending} disabled={!online} onPress={submit}>
          Request extension
        </Button>
      }>
      {due ? (
        <AppText variant="caption" tone="muted">
          {`Due back ${formatDate(due)}. The product manager decides on the extension.`}
        </AppText>
      ) : null}
      <DateRangePicker
        value={{ from: endDate, to: endDate }}
        onChange={({ from }) => {
          if (from !== null) setEndDate(from);
        }}
      />
      <AppText
        variant="caption"
        tone={attempted && problems.date ? 'danger' : 'muted'}
        aria-live="polite">
        {endDate ? `New return date: ${formatDate(endDate)}` : (problems.date ?? '')}
      </AppText>
      <TextField
        label="Reason"
        required
        multiline
        maxLength={REASON_MAX}
        value={reason}
        onChangeText={setReason}
        error={attempted ? problems.reason : undefined}
      />
      {failure ? (
        <Alert
          tone={failure.code === 'validation' ? 'danger' : 'warning'}
          message={
            failure.code === 'validation'
              ? (Object.values(failure.fieldErrors ?? {}).flat()[0] ?? failure.message)
              : failure.code === 'conflict'
                ? 'This borrowing changed. Close this and review the latest version.'
                : `${failure.message} Check the status before you try again.`
          }
        />
      ) : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to request an extension.
        </AppText>
      ) : null}
    </Sheet>
  );
}
