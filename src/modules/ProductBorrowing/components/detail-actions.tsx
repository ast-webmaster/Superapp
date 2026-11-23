import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import {
  ActionBar,
  Alert,
  AppText,
  Button,
  useConfirm,
  type AlertTone,
  type IconName,
} from '@/shared/ui';

import { useProductBorrowingAction } from '../hooks/use-product-borrowing-action';
import { submitFailureMessage } from '../create/draft';
import { productBorrowingRoutes } from '../navigation/routes';
import type { ProductBorrowingAction, ProductBorrowingDetail } from '../types';
import { ExtendSheet } from './extend-sheet';
import { statusBadge } from './status';

/** The server's limits on a reason (`remarks`: 6 to 1000 characters). */
const REASON_MIN_LENGTH = 6;
const REASON_MAX_LENGTH = 1000;

type ActionCopy = {
  label: string;
  question: string;
  /** What the dialog's confirm button says, when the bar's short label would not be clear there. */
  confirmLabel?: string;
  /** A reason is asked for, and the server refuses the action without one. */
  reason?: boolean;
  icon: IconName;
  destructive?: boolean;
};

const COPY: Record<ProductBorrowingAction, ActionCopy> = {
  approve: { label: 'Approve', question: 'Approve this borrowing?', icon: 'check' },
  process: { label: 'Process', question: 'Process this borrowing?', icon: 'box' },
  receive: {
    label: 'Receive',
    question: 'Mark the products as received back?',
    icon: 'check',
  },
  approve_extend: {
    label: 'Approve extension',
    question: 'Approve this extension?',
    confirmLabel: 'Approve',
    icon: 'check',
  },
  revise: {
    label: 'Revise',
    question: 'Send this borrowing back for revision?',
    reason: true,
    icon: 'info',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this borrowing?',
    reason: true,
    icon: 'alert',
    destructive: true,
  },
  reject_extend: {
    label: 'Reject extension',
    question: 'Reject this extension?',
    confirmLabel: 'Reject',
    reason: true,
    icon: 'alert',
    destructive: true,
  },
  cancel: {
    label: 'Cancel',
    question: 'Cancel this borrowing?',
    confirmLabel: 'Cancel borrowing',
    reason: true,
    icon: 'x',
    destructive: true,
  },
};

/** Order on screen: the forward action first. */
const ORDER: readonly ProductBorrowingAction[] = [
  'approve',
  'approve_extend',
  'process',
  'receive',
  'revise',
  'reject',
  'reject_extend',
  'cancel',
];

type DetailActionsProps = {
  detail: ProductBorrowingDetail;
  online: boolean;
};

/** True when the bar has something to show, so the screen can leave room for it. */
export function hasDetailActions(detail: ProductBorrowingDetail) {
  return detail.allowed_actions.some(
    (name) => name === 'edit' || name === 'extend' || name in COPY,
  );
}

/**
 * The bar pinned to the bottom of the detail screen: what the server offers this user, the
 * requester's own steps (fix a returned borrowing, ask for more time) and the outcome of the last
 * action (it stays after the actions disappear, since a finished document offers none). Reasons
 * are asked for in the confirm dialog.
 */
export function DetailActions({ detail, online }: DetailActionsProps) {
  const action = useProductBorrowingAction(detail.uuid);
  const confirm = useConfirm();
  const [extending, setExtending] = useState(false);

  const allowed = detail.allowed_actions;
  const available = ORDER.filter((name) => allowed.includes(name));
  const failure = action.error ? toAppError(action.error) : undefined;
  const outcome = action.isSuccess
    ? {
        tone: 'success' as AlertTone,
        message: `Saved. Status is now ${statusBadge(action.data.status).label}.`,
      }
    : failure
      ? outcomeOf(failure.code, submitFailureMessage(failure))
      : undefined;

  if (!hasDetailActions(detail) && !outcome) return null;

  const run = (name: ProductBorrowingAction) => {
    if (action.isPending) return;
    const { question, label, confirmLabel, icon, destructive, reason } = COPY[name];
    confirm({
      title: question,
      confirmLabel: confirmLabel ?? label,
      // The dialog's own Cancel would read the same as the action itself.
      cancelLabel: name === 'cancel' ? 'Keep it' : undefined,
      icon,
      destructive,
      reason: reason
        ? {
            label: 'Reason',
            required: true,
            minLength: REASON_MIN_LENGTH,
            maxLength: REASON_MAX_LENGTH,
            requiredMessage: `Enter a reason of at least ${REASON_MIN_LENGTH} characters.`,
          }
        : undefined,
      onConfirm: (remarks) =>
        action.mutateAsync({ action: name, remarks, updatedAt: detail.updated_at }),
    });
  };

  // The requester's own steps come first, then the approver's actions.
  const buttons: { key: string; label: string; loading: boolean; onPress: () => void }[] = [];
  if (allowed.includes('edit')) {
    buttons.push({
      key: 'edit',
      label: 'Revise and resubmit',
      loading: false,
      onPress: () => router.push(productBorrowingRoutes.resubmit(detail.uuid) as Href),
    });
  }
  if (allowed.includes('extend')) {
    buttons.push({
      key: 'extend',
      label: 'Extend',
      loading: false,
      onPress: () => setExtending(true),
    });
  }
  for (const name of available) {
    buttons.push({
      key: name,
      label: COPY[name].label,
      loading: action.isPending && action.variables?.action === name,
      onPress: () => run(name),
    });
  }

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {buttons.length > 0 ? (
        <View className="flex-row gap-2">
          {buttons.map((button, index) => (
            <Button
              key={button.key}
              block
              variant={index === 0 ? 'primary' : 'secondary'}
              className={index === 0 ? 'flex-2' : 'flex-1 px-2'}
              loading={button.loading}
              disabled={!online || action.isPending}
              onPress={button.onPress}>
              {button.label}
            </Button>
          ))}
        </View>
      ) : null}
      {buttons.length > 0 && !online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this borrowing.
        </AppText>
      ) : null}
      {extending ? (
        <ExtendSheet detail={detail} online={online} onClose={() => setExtending(false)} />
      ) : null}
    </ActionBar>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This borrowing changed before your action was saved. Review the latest version.',
    };
  }
  if (code === 'network' || code === 'timeout' || code === 'server') {
    return {
      tone: 'danger',
      message: 'Could not confirm your action. Check the status before you try again.',
    };
  }
  return { tone: 'danger', message };
}
