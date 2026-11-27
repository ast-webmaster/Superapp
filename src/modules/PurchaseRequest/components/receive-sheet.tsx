import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, Sheet, useToast, OptionRow } from '@/shared/ui';

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
      <View className="gap-2">
        {items.length > 1 ? (
          <OptionRow
            role="checkbox"
            label="Select all"
            selected={allSelected}
            disabled={isPending}
            onPress={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))}
          />
        ) : null}
        {items.map((line) => (
          <OptionRow
            key={line.id}
            role="checkbox"
            label={itemName(line)}
            selected={selected.has(line.id)}
            disabled={isPending}
            onPress={() => toggle(line.id)}
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
