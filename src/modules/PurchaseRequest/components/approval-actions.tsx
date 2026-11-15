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

import { usePurchaseRequestAction } from '../hooks/use-purchase-request-action';
import type { PurchaseRequestAction, PurchaseRequestDetail } from '../types';
import { statusBadge } from './status';

/** The server's limit for a reason (`remarks` is a varchar(191)). */
const REASON_MAX_LENGTH = 191;

const ACTIONS: Record<
  PurchaseRequestAction,
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
  process: {
    label: 'Process',
    question: 'Process this request?',
    reason: 'optional',
    icon: 'check',
  },
  revise: {
    label: 'Revise',
    question: 'Send this request back for revision?',
    reason: 'required',
    icon: 'info',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this request?',
    reason: 'required',
    icon: 'alert',
    destructive: true,
  },
};

/** Order on screen: the forward action first. */
const ORDER: readonly PurchaseRequestAction[] = ['approve', 'process', 'revise', 'reject'];

type ApprovalActionsProps = {
  detail: PurchaseRequestDetail;
  online: boolean;
};

/**
 * The decision bar pinned to the bottom of the detail screen: the actions the server offers
 * this user, and the outcome of the last one (it stays after the actions disappear, since an
 * approved request offers none). Revise and reject ask for their reason in the confirm dialog.
 */
export function ApprovalActions({ detail, online }: ApprovalActionsProps) {
  const action = usePurchaseRequestAction(detail.uuid);
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

  const run = (name: PurchaseRequestAction) => {
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
            maxLength: REASON_MAX_LENGTH,
            requiredMessage: 'Enter a reason to reject or send back this request.',
          }
        : undefined,
      onConfirm: (remarks) =>
        action.mutate({ action: name, remarks, updatedAt: detail.updated_at }),
    });
  };

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {available.length > 0 ? (
        <View className="flex-row gap-2">
          {available.map((name, index) => (
            <Button
              key={name}
              block
              variant={index === 0 ? 'primary' : 'secondary'}
              className={index === 0 ? 'flex-2' : 'flex-1 px-2'}
              loading={action.isPending && action.variables?.action === name}
              disabled={!online || action.isPending}
              onPress={() => run(name)}>
              {ACTIONS[name].label}
            </Button>
          ))}
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
