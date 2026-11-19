import { router, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useCurrentUser } from '@/core/auth';
import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ActionBar, Alert, AppText, Button, Screen, useConfirm } from '@/shared/ui';

import { AttachmentsStep } from '../components/create/attachments-step';
import { CostForm } from '../components/create/cost-form';
import { CostsStep, costName } from '../components/create/costs-step';
import { DestinationForm } from '../components/create/destination-form';
import { DestinationsStep } from '../components/create/destinations-step';
import { DetailsStep } from '../components/create/details-step';
import { ReviewStep } from '../components/create/review-step';
import { StepIndicator } from '../components/create/step-indicator';
import {
  allowanceRate,
  firstInvalidStep,
  isDirty,
  newCost,
  newDestination,
  STEPS,
  submitFailureMessage,
  validateStep,
  type FormContext,
  type StepKey,
} from '../create/draft';
import { useSubmitOnDutyRequest } from '../hooks/use-submit-on-duty-request';
import { onDutyRequestRoutes } from '../navigation/routes';
import type {
  DraftCost,
  DraftDestination,
  OnDutyOptions,
  OnDutyRequestDraft,
  TripType,
} from '../types';

const pad = (value: number) => String(value).padStart(2, '0');

/** Today in the phone's time zone, YYYY-MM-DD. The server sets the real date when it saves. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

type Editing =
  { kind: 'destination'; row: DraftDestination } | { kind: 'cost'; row: DraftCost } | null;

export interface OnDutyRequestFormProps {
  options: OnDutyOptions;
  /** What the form starts with: empty for a new request, the server's copy for a resubmit. */
  initial: OnDutyRequestDraft;
  /** Set to resubmit this document instead of creating a new one. */
  resubmitUuid?: string;
}

/** The stepped form behind both a new request and the resubmit of one that was sent back. */
export function OnDutyRequestForm({ options, initial, resubmitUuid }: OnDutyRequestFormProps) {
  const user = useCurrentUser();
  const confirm = useConfirm();
  const navigation = useNavigation();
  const online = useIsOnline();
  const { mutate, isPending, error, reset } = useSubmitOnDutyRequest(resubmitUuid);

  const [draft, setDraft] = useState<OnDutyRequestDraft>(initial);
  const [stepIndex, setStepIndex] = useState(0);
  // Errors stay hidden until the user tries to continue, so a fresh step is not red.
  const [attempted, setAttempted] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [savedUuid, setSavedUuid] = useState<string | null>(null);
  const [day] = useState(today);

  const context: FormContext = {
    letterRequired: resubmitUuid === undefined,
    allowanceRate: allowanceRate(options, draft.type),
  };
  const step: StepKey = STEPS[stepIndex]?.key ?? 'details';
  const last = stepIndex === STEPS.length - 1;
  const errors = attempted ? validateStep(step, draft, context) : {};

  // Leaving with work in the form asks first. Once the server has saved it, nothing is lost.
  usePreventRemove(isDirty(draft, initial) && savedUuid === null, ({ data }) =>
    confirm({
      title: resubmitUuid ? 'Discard your changes?' : 'Discard this request?',
      message: 'What you entered will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      icon: 'alert',
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );

  useEffect(() => {
    if (!savedUuid) return;
    // A new request replaces the form; a resubmit goes back to the document it was opened from.
    if (resubmitUuid) router.dismissTo(onDutyRequestRoutes.detail(savedUuid) as never);
    else router.replace(onDutyRequestRoutes.detail(savedUuid) as never);
  }, [savedUuid, resubmitUuid]);

  const update = (patch: Partial<OnDutyRequestDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const goTo = (key: StepKey) => {
    setAttempted(false);
    reset();
    setStepIndex(STEPS.findIndex((item) => item.key === key));
  };

  const next = () => {
    if (Object.keys(validateStep(step, draft, context)).length > 0) {
      setAttempted(true);
      return;
    }
    goTo(STEPS[stepIndex + 1]?.key ?? 'review');
  };

  const submit = () => {
    // Every earlier step was checked on the way here, but a step can be edited from the review.
    const invalid = firstInvalidStep(draft, context);
    if (invalid) {
      goTo(invalid);
      setAttempted(true);
      return;
    }
    confirm({
      title: resubmitUuid ? 'Resubmit this request?' : 'Submit this request?',
      message: resubmitUuid
        ? 'Your changes replace what was sent, and the approval starts again from the first step.'
        : 'It goes into the approval flow straight away.',
      confirmLabel: resubmitUuid ? 'Resubmit' : 'Submit',
      icon: 'clipboard',
      onConfirm: () => {
        if (isPending) return;
        mutate(draft, { onSuccess: (detail) => setSavedUuid(detail.uuid) });
      },
    });
  };

  const upsert = <T extends { id: string }>(rows: T[], row: T) =>
    rows.some(({ id }) => id === row.id)
      ? rows.map((existing) => (existing.id === row.id ? row : existing))
      : [...rows, row];

  const failure = error ? toAppError(error) : null;
  const requester = user?.name ?? '';
  const type: TripType = draft.type ?? 'DOMESTIC';

  // A row form is a screen of its own, with its own pinned Save and Cancel.
  if (editing?.kind === 'destination') {
    return (
      <Screen>
        <DestinationForm
          title={
            draft.destinations.some(({ id }) => id === editing.row.id)
              ? 'Edit destination'
              : 'New destination'
          }
          type={type}
          initial={editing.row}
          others={draft.destinations.filter(({ id }) => id !== editing.row.id)}
          onSave={(row) => {
            update({ destinations: upsert(draft.destinations, row) });
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      </Screen>
    );
  }
  if (editing?.kind === 'cost') {
    return (
      <Screen>
        <CostForm
          title={draft.costs.some(({ id }) => id === editing.row.id) ? 'Edit cost' : 'New cost'}
          initial={editing.row}
          canShare={draft.brands.length > 1}
          onSave={(row) => {
            update({ costs: upsert(draft.costs, row) });
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <StepIndicator current={stepIndex} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-2">
        {step === 'details' ? (
          <DetailsStep
            draft={draft}
            brands={options.brands}
            letterRequired={context.letterRequired}
            onChange={update}
            errors={errors}
          />
        ) : step === 'destinations' ? (
          <DestinationsStep
            destinations={draft.destinations}
            rate={context.allowanceRate}
            errors={errors}
            onAdd={() => setEditing({ kind: 'destination', row: newDestination() })}
            onEdit={(row) => setEditing({ kind: 'destination', row })}
            onRemove={(row) =>
              confirm({
                title: 'Remove this destination?',
                message: row.destination ?? undefined,
                confirmLabel: 'Remove',
                destructive: true,
                onConfirm: () =>
                  update({ destinations: draft.destinations.filter(({ id }) => id !== row.id) }),
              })
            }
          />
        ) : step === 'costs' ? (
          <CostsStep
            costs={draft.costs}
            errors={errors}
            onAdd={() => setEditing({ kind: 'cost', row: newCost() })}
            onEdit={(row) => setEditing({ kind: 'cost', row })}
            onRemove={(row) =>
              confirm({
                title: 'Remove this cost?',
                message: costName(row),
                confirmLabel: 'Remove',
                destructive: true,
                onConfirm: () => update({ costs: draft.costs.filter(({ id }) => id !== row.id) }),
              })
            }
          />
        ) : step === 'attachments' ? (
          <AttachmentsStep
            attachments={draft.attachments}
            errors={errors}
            onChange={(attachments) => update({ attachments })}
            replacesOld={resubmitUuid !== undefined}
          />
        ) : (
          <>
            <ReviewStep
              draft={draft}
              brands={options.brands}
              requester={requester}
              today={day}
              rate={context.allowanceRate}
              keepsLetter={!context.letterRequired}
              onEdit={goTo}
            />
            {failure ? (
              <Alert
                tone={failure.code === 'validation' ? 'danger' : 'warning'}
                message={
                  failure.code === 'validation' ||
                  failure.code === 'forbidden' ||
                  failure.code === 'conflict'
                    ? submitFailureMessage(failure)
                    : `${failure.message} Check the request list before you send it again.`
                }
              />
            ) : null}
          </>
        )}
      </ScrollView>
      <ActionBar>
        {last && !online ? (
          <AppText variant="caption" tone="muted">
            {`You are offline. Connect to ${resubmitUuid ? 'resubmit' : 'submit'}.`}
          </AppText>
        ) : null}
        <View className="flex-row gap-2">
          {stepIndex > 0 ? (
            <Button
              block
              variant="secondary"
              className="flex-1 px-2"
              disabled={isPending}
              onPress={() => goTo(STEPS[stepIndex - 1]?.key ?? 'details')}>
              Back
            </Button>
          ) : null}
          <Button
            block
            className="flex-2"
            loading={isPending}
            disabled={last && !online}
            onPress={last ? submit : next}>
            {last ? (resubmitUuid ? 'Resubmit request' : 'Submit request') : 'Next'}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
