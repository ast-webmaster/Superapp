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

import { useMarketingPromoAction } from '../hooks/use-marketing-promo-action';
import type { MarketingPromoAction, MarketingPromoDetail, MarketingPromoKind } from '../types';
import { statusBadge } from './status';

/** The server's limits for a reason (`remarks` is 6 to 191 characters). */
const REASON_MIN_LENGTH = 6;
const REASON_MAX_LENGTH = 191;

const ACTIONS: Record<
  MarketingPromoAction,
  {
    label: string;
    question: string;
    reason: 'required' | 'optional';
    requiredMessage?: string;
    icon: IconName;
    destructive?: boolean;
  }
> = {
  approve: {
    label: 'Approve',
    question: 'Approve this promo?',
    reason: 'optional',
    icon: 'check',
  },
  revise: {
    label: 'Revise',
    question: 'Send this promo back for revision?',
    reason: 'required',
    requiredMessage: `Enter a reason of at least ${REASON_MIN_LENGTH} characters to send back this promo.`,
    icon: 'info',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this promo?',
    reason: 'required',
    requiredMessage: `Enter a reason of at least ${REASON_MIN_LENGTH} characters to reject this promo.`,
    icon: 'alert',
    destructive: true,
  },
  cancel: {
    label: 'Cancel promo',
    question: 'Cancel this promo?',
    reason: 'required',
    requiredMessage: `Enter a reason of at least ${REASON_MIN_LENGTH} characters to cancel this promo.`,
    icon: 'x',
    destructive: true,
  },
};

/** Order on screen: the forward action first, the cancellation last. */
const ORDER: readonly MarketingPromoAction[] = ['approve', 'revise', 'reject', 'cancel'];

type ApprovalActionsProps = {
  kind: MarketingPromoKind;
  detail: MarketingPromoDetail;
  online: boolean;
};

/**
 * The decision bar pinned to the bottom of the detail screen: the actions the server offers
 * this user, and the outcome of the last one (it stays after the actions disappear, since a
 * finished step offers none). Revise, reject and cancel ask for their reason in the confirm
 * dialog.
 */
export function ApprovalActions({ kind, detail, online }: ApprovalActionsProps) {
  const action = useMarketingPromoAction(kind, detail.uuid);
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

  const run = (name: MarketingPromoAction) => {
    if (action.isPending) return;
    const { question, label, icon, destructive, reason, requiredMessage } = ACTIONS[name];
    confirm({
      title: question,
      confirmLabel: label,
      icon,
      destructive,
      reason: {
        label: reason === 'optional' ? 'Reason (optional)' : 'Reason',
        required: reason === 'required',
        minLength: REASON_MIN_LENGTH,
        maxLength: REASON_MAX_LENGTH,
        requiredMessage,
      },
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
          {available.map((name) => (
            <Button
              key={name}
              block
              variant={name === 'approve' ? 'primary' : 'secondary'}
              className={name === 'approve' ? 'flex-2' : 'flex-1 px-2'}
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
          Connect to the internet to act on this promo.
        </AppText>
      ) : null}
    </ActionBar>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This promo changed before your action was saved. Review the latest version.',
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
