import { useState } from 'react';

import { Alert, AppText, Button, ChipGroup, Sheet } from '@/shared/ui';

import { failureOutcome } from '../write-outcome';
import { priorityLabel } from '../status';
import type { ActionSheetProps } from './due-date-sheet';

const OPTIONS = (['HIGH', 'MEDIUM'] as const).map((value) => ({
  value,
  label: priorityLabel(value),
}));

/** The approver raises a request to high priority, or lowers it back to medium. */
export function PrioritySheet({ detail, online, action, onClose }: ActionSheetProps) {
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM'>(
    detail.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
  );
  const unchanged = priority === detail.priority;

  const submit = () => {
    if (action.isPending || unchanged) return;
    action.mutate(
      { action: 'set_priority', priority, updatedAt: detail.updated_at },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet
      visible
      title="Set priority"
      onClose={onClose}
      footer={
        <Button block loading={action.isPending} disabled={!online || unchanged} onPress={submit}>
          Save priority
        </Button>
      }>
      <ChipGroup
        label="Priority"
        options={OPTIONS}
        value={priority}
        onChange={(value) => setPriority(value as 'HIGH' | 'MEDIUM')}
      />
      {action.error ? <Alert {...failureOutcome(action.error)} /> : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to change the priority.
        </AppText>
      ) : null}
    </Sheet>
  );
}
