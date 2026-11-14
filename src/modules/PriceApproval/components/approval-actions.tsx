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

import { usePriceApprovalAction } from '../hooks/use-price-approval-action';
import type { PriceApprovalAction, PriceApprovalDetail } from '../types';
import { statusBadge } from './status';

const ACTIONS: Record<
  PriceApprovalAction,
  {
    label: string;
    question: string;
    reason?: 'required' | 'optional';
    icon: IconName;
    destructive?: boolean;
  }
> = {
  approve: {
    label: 'Approve',
    question: 'Approve this request?',
    reason: 'optional',
    icon: 'check',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this request?',
    reason: 'required',
    icon: 'alert',
    destructive: true,
  },
  pending: {
    label: 'Hold',
    question: 'Hold this request and send it back to the requester?',
    reason: 'required',
    icon: 'info',
  },
  no_approval_needed: {
    label: 'Mark no approval needed',
    question: 'Close this request as needing no approval?',
    icon: 'info',
  },
};

/** Order on screen: the main action first. */
const ORDER: readonly PriceApprovalAction[] = [
  'approve',
  'reject',
  'pending',
  'no_approval_needed',
];

type ApprovalActionsProps = {
  detail: PriceApprovalDetail;
  online: boolean;
};

/**
 * The decision bar pinned to the bottom of the detail screen: the actions the server offers
 * this user, and the outcome of the last one (it stays after the actions disappear, since an
 * approved request offers none). Reject and hold ask for their reason in the confirm dialog.
 */
export function ApprovalActions({ detail, online }: ApprovalActionsProps) {
  const action = usePriceApprovalAction(detail.pa_uuid);
  const confirm = useConfirm();

  const available = ORDER.filter((name) => detail.allowed_actions.includes(name));
  const failure = action.error ? toAppError(action.error) : undefined;
  const outcome = action.isSuccess
    ? {
        tone: 'success' as AlertTone,
        message: `Saved. Status is now ${statusBadge(action.data.status).label}.`,
      }
    : failure
      ? outcomeOf(failure.code, failure.message)
      : undefined;

  if (available.length === 0 && !outcome) return null;

  const run = (name: PriceApprovalAction) => {
    if (action.isPending) return;
    const { question, label, icon, destructive, reason } = ACTIONS[name];
    confirm({
      title: question,
      confirmLabel: label,
      icon,
      destructive,
      reason: reason
        ? {
            label: reason === 'optional' ? 'Reason (optional)' : 'Reason',
            required: reason === 'required',
            maxLength: 255,
            requiredMessage: 'Enter a reason to reject or hold this request.',
          }
        : undefined,
      onConfirm: (remarks) =>
        action.mutate({ action: name, remarks, updatedAt: detail.updated_at }),
    });
  };

  const button = (name: PriceApprovalAction, className: string) => (
    <Button
      key={name}
      block
      variant={name === 'approve' ? 'primary' : 'secondary'}
      className={className}
      loading={action.isPending && action.variables?.action === name}
      disabled={!online || action.isPending}
      onPress={() => run(name)}>
      {ACTIONS[name].label}
    </Button>
  );

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {available.includes('no_approval_needed') ? button('no_approval_needed', '') : null}
      {available.some((name) => name !== 'no_approval_needed') ? (
        <View className="flex-row gap-2">
          {available
            .filter((name) => name !== 'no_approval_needed')
            .map((name) => button(name, name === 'approve' ? 'flex-2' : 'flex-1 px-2'))}
        </View>
      ) : null}
      {available.length > 0 && !online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this request.
        </AppText>
      ) : null}
    </ActionBar>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This request changed before your action was saved. Review the latest version.',
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
