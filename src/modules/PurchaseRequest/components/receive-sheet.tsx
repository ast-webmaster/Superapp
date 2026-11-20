import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, Icon, Sheet, useToast } from '@/shared/ui';

import { useReceivePurchaseRequest } from '../hooks/use-receive-purchase-request';
import type { PurchaseRequestDetail, PurchaseRequestLine } from '../types';
import { statusBadge } from './status';

export interface ReceiveSheetProps {
  detail: PurchaseRequestDetail;
  online: boolean;
  onClose: () => void;
}

const itemName = (line: PurchaseRequestLine) =>
  line.item_description ?? line.item_no ?? line.item_code ?? '-';

/** A row of the list: the label on the left, the checkbox on the right. */
function CheckRow({
  label,
  checked,
  strong,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  strong?: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    // The whole row is the 48 tall press area; the visible box is 24.
    <Pressable
      role="checkbox"
      aria-checked={checked}
      accessibilityState={{ checked, disabled }}
      accessible
      disabled={disabled}
      onPress={onToggle}
      className="min-h-touch flex-row items-center gap-3 rounded-md active:bg-surface-gray">
      <AppText variant={strong ? 'body-strong' : 'body'} className="min-w-0 flex-1">
        {label}
      </AppText>
      <View
        className={clsx(
          'size-6 items-center justify-center rounded-sm border',
          checked ? 'border-primary bg-primary' : 'border-control-off bg-surface',
        )}>
        {checked ? <Icon name="check" size={16} color="on-primary" /> : null}
      </View>
    </Pressable>
  );
}

/**
 * Lists the items the user may receive, each with a checkbox, and sends the ticked ones. Nothing
 * is ticked at first: receiving says the goods arrived in good condition, so the user chooses.
 * The server re-checks every item and answers 409 for one that was received in the meantime.
 */
export function ReceiveSheet({ detail, online, onClose }: ReceiveSheetProps) {
  const toast = useToast();
  const { mutate, isPending, error, reset } = useReceivePurchaseRequest(detail.uuid);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());

  const items = detail.items.filter((line) => line.can_receive);
  const allSelected = items.length > 0 && selected.size === items.length;
  const failure = error ? toAppError(error) : null;

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const close = () => {
    reset();
    onClose();
  };

  const confirm = () => {
    if (isPending || selected.size === 0) return;
    mutate([...selected], {
      onSuccess: (updated) => {
        toast.show({
          tone: 'success',
          message: `Saved. Status is now ${statusBadge(updated.status).label}.`,
        });
        onClose();
      },
    });
  };

  return (
    <Sheet
      visible
      title="Receive items"
      onClose={close}
      footer={
        <Button
          block
          loading={isPending}
          disabled={!online || selected.size === 0}
          onPress={confirm}>
          Confirm receive
        </Button>
      }>
      <AppText variant="caption" tone="muted">
        Tick the items you have received in good condition.
      </AppText>
      <View>
        {items.length > 1 ? (
          <CheckRow
            strong
            label="Select all"
            checked={allSelected}
            disabled={isPending}
            onToggle={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))}
          />
        ) : null}
        {items.map((line) => (
          <CheckRow
            key={line.id}
            label={itemName(line)}
            checked={selected.has(line.id)}
            disabled={isPending}
            onToggle={() => toggle(line.id)}
          />
        ))}
      </View>
      {failure ? (
        <Alert
          tone={failure.code === 'conflict' ? 'warning' : 'danger'}
          message={
            failure.code === 'conflict'
              ? 'Some of these items were already received. Close this and review the latest version.'
              : failure.code === 'validation'
                ? failure.message
                : `${failure.message} Check the status before you try again.`
          }
        />
      ) : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to receive items.
        </AppText>
      ) : null}
    </Sheet>
  );
}
