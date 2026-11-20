import { useState } from 'react';

import { ActionBar, AppText, Button } from '@/shared/ui';

import type { PurchaseRequestDetail } from '../types';
import { ReceiveSheet } from './receive-sheet';

type ReceiveActionsProps = {
  detail: PurchaseRequestDetail;
  online: boolean;
};

/**
 * The bar pinned to the bottom of the detail screen when the requester has items to receive.
 * "Receive" opens a sheet to tick the items. The server marks each item with `can_receive`
 * (only the requester, on a completed request, for ordered items not received yet).
 */
export function ReceiveActions({ detail, online }: ReceiveActionsProps) {
  const [open, setOpen] = useState(false);

  if (!detail.items.some((line) => line.can_receive)) return null;

  return (
    <>
      <ActionBar>
        <Button block disabled={!online} onPress={() => setOpen(true)}>
          Receive
        </Button>
        {!online ? (
          <AppText variant="caption" tone="muted">
            Connect to the internet to receive items.
          </AppText>
        ) : null}
      </ActionBar>
      {open ? <ReceiveSheet detail={detail} online={online} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
