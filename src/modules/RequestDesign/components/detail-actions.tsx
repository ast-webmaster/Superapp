import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ActionBar, Alert, AppText, Button, useConfirm, type IconName } from '@/shared/ui';

import { useRequestDesignAction } from '../hooks/use-request-design-action';
import { requestDesignRoutes } from '../navigation/routes';
import type { DetailAction, RequestDesignDetail } from '../types';
import { AssignSheet } from './actions/assign-sheet';
import { DueDateSheet } from './actions/due-date-sheet';
import { PointsSheet } from './actions/points-sheet';
import { PrioritySheet } from './actions/priority-sheet';
import { SubmitResultSheet } from './actions/submit-result-sheet';
import { statusLabel } from './status';
import { failureOutcome } from './write-outcome';

/** The server's limits on the reason of a cancel. */
const REASON_MIN = 6;
const REASON_MAX = 1000;

type ActionCopy = {
  label: string;
  icon: IconName;
  /** Set for an action the server takes after one confirmation. Others open a sheet or a screen. */
  confirm?: {
    question: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    reason?: boolean;
  };
};

const COPY: Record<DetailAction, ActionCopy> = {
  pick: { label: 'Pick up', icon: 'check', confirm: { question: 'Pick up this request?' } },
  submit_file: { label: 'Send result', icon: 'upload' },
  approve: {
    label: 'Approve',
    icon: 'check',
    confirm: { question: 'Approve this result?', confirmLabel: 'Approve' },
  },
  approve_due_date: {
    label: 'Accept new date',
    icon: 'calendar',
    confirm: { question: 'Accept the new due date?', confirmLabel: 'Accept' },
  },
  reject_due_date: {
    label: 'Decline new date',
    icon: 'x',
    confirm: { question: 'Decline the new due date?', confirmLabel: 'Decline' },
  },
  request_due_date: { label: 'Ask new date', icon: 'calendar' },
  assign: { label: 'Assign designer', icon: 'user' },
  set_priority: { label: 'Set priority', icon: 'star' },
  set_points: { label: 'Set points', icon: 'chart' },
  edit: { label: 'Edit', icon: 'pencil' },
  cancel: {
    label: 'Cancel request',
    icon: 'x',
    confirm: {
      question: 'Cancel this request?',
      confirmLabel: 'Cancel request',
      cancelLabel: 'Keep it',
      destructive: true,
      reason: true,
    },
  },
};

/** Order on screen: the forward action first, the way out last. */
const ORDER: readonly DetailAction[] = [
  'pick',
  'submit_file',
  'approve',
  'approve_due_date',
  'reject_due_date',
  'request_due_date',
  'assign',
  'set_priority',
  'set_points',
  'edit',
  'cancel',
];

const offered = (detail: RequestDesignDetail) =>
  ORDER.filter((name) => detail.allowed_actions.includes(name));

/** True when the bar has something to show, so the screen can leave room for it. */
export function hasDetailActions(detail: RequestDesignDetail) {
  return offered(detail).length > 0;
}

/** The actions that open a sheet of their own, one at a time. */
type SheetName = 'submit_file' | 'request_due_date' | 'assign' | 'set_priority' | 'set_points';

const isSheet = (name: DetailAction): name is SheetName =>
  name === 'submit_file' ||
  name === 'request_due_date' ||
  name === 'assign' ||
  name === 'set_priority' ||
  name === 'set_points';

type DetailActionsProps = {
  detail: RequestDesignDetail;
  online: boolean;
};

/**
 * The bar pinned to the bottom of the detail screen: what the server offers this user, and the
 * outcome of the last write (it stays after the actions disappear, since a settled document offers
 * none). The first action is the button; the rest sit under "More" so the bar never crowds. An
 * action that needs input opens a sheet, one that needs a reason asks in the confirm dialog.
 */
export function DetailActions({ detail, online }: DetailActionsProps) {
  const action = useRequestDesignAction(detail.uuid);
  const confirm = useConfirm();
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [more, setMore] = useState(false);

  const available = offered(detail);
  const outcome =
    sheet !== null
      ? undefined
      : action.isSuccess
        ? {
            tone: 'success' as const,
            message: `Saved. Status is now ${statusLabel(action.data.status)}.`,
          }
        : action.error
          ? failureOutcome(action.error)
          : undefined;

  if (available.length === 0 && !outcome) return null;

  const closeSheet = () => {
    action.reset();
    setSheet(null);
  };

  const run = (name: DetailAction) => {
    if (action.isPending) return;
    setMore(false);
    if (name === 'edit') {
      router.push(requestDesignRoutes.edit(detail.uuid) as never);
      return;
    }
    if (isSheet(name)) {
      action.reset();
      setSheet(name);
      return;
    }
    const { confirm: ask, label } = COPY[name];
    if (!ask) return;
    confirm({
      title: ask.question,
      confirmLabel: ask.confirmLabel ?? label,
      cancelLabel: ask.cancelLabel,
      icon: COPY[name].icon,
      destructive: ask.destructive,
      reason: ask.reason
        ? {
            label: 'Reason',
            required: true,
            minLength: REASON_MIN,
            maxLength: REASON_MAX,
            requiredMessage: `Write at least ${REASON_MIN} characters.`,
          }
        : undefined,
      onConfirm: (remarks) =>
        action.mutateAsync({
          action: name,
          remarks,
          updatedAt: detail.updated_at,
        }),
    });
  };

  const [primary, ...others] = available;
  const sheetProps = { detail, online, action, onClose: closeSheet };

  return (
    <>
      <ActionBar>
        {outcome ? (
          <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
        ) : null}
        {more
          ? others.map((name) => (
              <Button
                key={name}
                block
                variant="secondary"
                iconLeft={COPY[name].icon}
                disabled={!online || action.isPending}
                onPress={() => run(name)}>
                {COPY[name].label}
              </Button>
            ))
          : null}
        {primary ? (
          <View className="flex-row gap-2">
            <Button
              block
              className="flex-2"
              loading={action.isPending && action.variables?.action === primary}
              disabled={!online || action.isPending}
              onPress={() => run(primary)}>
              {COPY[primary].label}
            </Button>
            {others.length === 1 && others[0] ? (
              <Button
                block
                variant="secondary"
                className="flex-1 px-2"
                disabled={!online || action.isPending}
                onPress={() => run(others[0]!)}>
                {COPY[others[0]].label}
              </Button>
            ) : others.length > 1 ? (
              <Button
                block
                variant="secondary"
                className="flex-1 px-2"
                aria-expanded={more}
                onPress={() => setMore((open) => !open)}>
                {more ? 'Less' : 'More'}
              </Button>
            ) : null}
          </View>
        ) : null}
        {available.length > 0 && !online ? (
          <AppText variant="caption" tone="muted">
            Connect to the internet to act on this request.
          </AppText>
        ) : null}
      </ActionBar>
      {sheet === 'submit_file' ? <SubmitResultSheet {...sheetProps} /> : null}
      {sheet === 'request_due_date' ? <DueDateSheet {...sheetProps} /> : null}
      {sheet === 'assign' ? <AssignSheet {...sheetProps} /> : null}
      {sheet === 'set_priority' ? <PrioritySheet {...sheetProps} /> : null}
      {sheet === 'set_points' ? <PointsSheet {...sheetProps} /> : null}
    </>
  );
}
