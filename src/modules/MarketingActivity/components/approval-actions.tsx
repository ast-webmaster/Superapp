import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import type { PickedFile } from '@/core/files';
import {
  ActionBar,
  Alert,
  AppText,
  Button,
  useConfirm,
  type AlertTone,
  type IconName,
} from '@/shared/ui';

import { useMarketingActivityAction } from '../hooks/use-marketing-activity-action';
import type {
  MarketingActivityAction,
  MarketingActivityDetail,
  MarketingActivityKind,
} from '../types';
import { ClaimSheet } from './claim-sheet';
import { statusBadge } from './status';

/** The server's limits for a reason (`remarks` is 6 to 191 characters). */
const REASON_MIN_LENGTH = 6;
const REASON_MAX_LENGTH = 191;

const ACTIONS: Record<
  Exclude<MarketingActivityAction, 'claim'>,
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
    question: 'Approve this activity?',
    reason: 'optional',
    icon: 'check',
  },
  finish_realization: {
    label: 'Finish realization',
    question: 'Mark the realization as finished?',
    icon: 'check',
  },
  complete: {
    label: 'Complete',
    question: 'Mark this activity as completed?',
    icon: 'check',
  },
  revise: {
    label: 'Revise',
    question: 'Send this activity back for revision?',
    reason: 'required',
    icon: 'info',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this activity?',
    reason: 'required',
    icon: 'alert',
    destructive: true,
  },
};

/** Order on screen: the forward action first. */
const ORDER: readonly MarketingActivityAction[] = [
  'approve',
  'complete',
  'claim',
  'finish_realization',
  'revise',
  'reject',
];

const labelOf = (name: MarketingActivityAction) =>
  name === 'claim' ? 'Claim' : ACTIONS[name].label;

type ApprovalActionsProps = {
  kind: MarketingActivityKind;
  detail: MarketingActivityDetail;
  online: boolean;
};

/**
 * The decision bar pinned to the bottom of the detail screen: the actions the server offers
 * this user, and the outcome of the last one (it stays after the actions disappear, since a
 * finished step offers none). Revise and reject ask for their reason in the confirm dialog;
 * a claim asks for its proof file in a sheet.
 */
export function ApprovalActions({ kind, detail, online }: ApprovalActionsProps) {
  const action = useMarketingActivityAction(kind, detail.activity_uuid);
  const confirm = useConfirm();
  const [claiming, setClaiming] = useState(false);

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

  const claim = (file: PickedFile) => {
    setClaiming(false);
    if (action.isPending) return;
    action.mutate({ action: 'claim', file, updatedAt: detail.updated_at });
  };

  const run = (name: MarketingActivityAction) => {
    if (action.isPending) return;
    if (name === 'claim') {
      setClaiming(true);
      return;
    }
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
            minLength: REASON_MIN_LENGTH,
            maxLength: REASON_MAX_LENGTH,
            requiredMessage: `Enter a reason of at least ${REASON_MIN_LENGTH} characters to reject or send back this activity.`,
          }
        : undefined,
      onConfirm: (remarks) =>
        action.mutateAsync({ action: name, remarks, updatedAt: detail.updated_at }),
    });
  };

  return (
    <ActionBar>
      <ClaimSheet visible={claiming} onClose={() => setClaiming(false)} onSubmit={claim} />
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
              {labelOf(name)}
            </Button>
          ))}
        </View>
      ) : null}
      {available.length > 0 && !online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this activity.
        </AppText>
      ) : null}
    </ActionBar>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This activity changed before your action was saved. Review the latest version.',
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
