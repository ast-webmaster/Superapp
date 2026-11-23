import { useState } from 'react';

import { Alert, AppText, Button, DateRangePicker, Sheet } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { todayIso } from '../../create/draft';
import type { RequestDesignActionMutation } from '../../hooks/use-request-design-action';
import type { RequestDesignDetail } from '../../types';
import { failureOutcome } from '../write-outcome';

export interface ActionSheetProps {
  detail: RequestDesignDetail;
  online: boolean;
  action: RequestDesignActionMutation;
  onClose: () => void;
}

/**
 * The designer asks for a later due date. The requester then accepts or declines it, and the
 * request goes back to being picked either way.
 */
export function DueDateSheet({ detail, online, action, onClose }: ActionSheetProps) {
  const [date, setDate] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const problem =
    date === null
      ? 'Choose the new due date.'
      : date < todayIso()
        ? 'Choose today or a later date.'
        : undefined;

  const submit = () => {
    if (action.isPending) return;
    if (problem || date === null) {
      setAttempted(true);
      return;
    }
    action.mutate(
      { action: 'request_due_date', dueDate: date, updatedAt: detail.updated_at },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet
      visible
      fullHeight
      title="Ask for a new due date"
      onClose={onClose}
      footer={
        <Button block loading={action.isPending} disabled={!online} onPress={submit}>
          Send request
        </Button>
      }>
      <AppText variant="caption" tone="muted">
        {`Due ${formatDate(detail.due_date)} now. The requester decides on the new date.`}
      </AppText>
      <DateRangePicker
        value={{ from: date, to: date }}
        onChange={({ from }) => {
          if (from !== null) setDate(from);
        }}
      />
      <AppText
        variant="caption"
        tone={attempted && problem ? 'danger' : 'muted'}
        aria-live="polite">
        {date ? `New due date: ${formatDate(date)}` : attempted ? (problem ?? '') : ''}
      </AppText>
      {action.error ? <Alert {...failureOutcome(action.error)} /> : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to send this.
        </AppText>
      ) : null}
    </Sheet>
  );
}
