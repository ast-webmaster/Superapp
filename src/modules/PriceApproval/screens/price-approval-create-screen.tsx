import { router, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useCurrentUser } from '@/core/auth';
import { toAppError } from '@/core/errors';
import { ActionBar, Alert, AppText, Button, Screen, useConfirm } from '@/shared/ui';

import { AttachmentsStep } from '../components/create/attachments-step';
import { DetailsStep } from '../components/create/details-step';
import { ItemForm } from '../components/create/item-form';
import { ItemsStep } from '../components/create/items-step';
import { ReviewStep } from '../components/create/review-step';
import { StepIndicator } from '../components/create/step-indicator';
import {
  emptyDraft,
  firstInvalidStep,
  isDirty,
  newItem,
  STEPS,
  validateStep,
  type StepKey,
} from '../create/draft';
import { useCreatePriceApproval } from '../hooks/use-create-price-approval';
import { useIsOnline } from '../hooks/use-is-online';
import { priceApprovalRoutes } from '../navigation/routes';
import type { DraftItem, PriceApprovalDraft } from '../types';

const pad = (value: number) => String(value).padStart(2, '0');

/** Today in the phone's time zone, YYYY-MM-DD. The server sets the real date when it saves. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function PriceApprovalCreateScreen() {
  const user = useCurrentUser();
  const confirm = useConfirm();
  const navigation = useNavigation();
  const online = useIsOnline();
  const { mutate, isPending, error, reset } = useCreatePriceApproval();

  const [draft, setDraft] = useState<PriceApprovalDraft>(emptyDraft);
  const [stepIndex, setStepIndex] = useState(0);
  // Errors stay hidden until the user tries to continue, so a fresh step is not red.
  const [attempted, setAttempted] = useState(false);
  const [editing, setEditing] = useState<DraftItem | null>(null);
  const [createdUuid, setCreatedUuid] = useState<string | null>(null);
  const [day] = useState(today);

  const step: StepKey = STEPS[stepIndex]?.key ?? 'details';
  const last = stepIndex === STEPS.length - 1;
  const errors = attempted ? validateStep(step, draft) : {};

  // Leaving with work in the form asks first. Once the server has saved it, nothing is lost.
  usePreventRemove(isDirty(draft) && createdUuid === null, ({ data }) =>
    confirm({
      title: 'Discard this request?',
      message: 'What you entered will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      icon: 'alert',
      destructive: true,
      onConfirm: () => navigation.dispatch(data.action),
    }),
  );

  useEffect(() => {
    if (createdUuid) router.replace(priceApprovalRoutes.detail(createdUuid) as never);
  }, [createdUuid]);

  const update = (patch: Partial<PriceApprovalDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const goTo = (key: StepKey) => {
    setAttempted(false);
    reset();
    setStepIndex(STEPS.findIndex((item) => item.key === key));
  };

  const next = () => {
    if (Object.keys(validateStep(step, draft)).length > 0) {
      setAttempted(true);
      return;
    }
    goTo(STEPS[stepIndex + 1]?.key ?? 'review');
  };

  const submit = () => {
    // Every earlier step was checked on the way here, but a step can be edited from the review.
    const invalid = firstInvalidStep(draft);
    if (invalid) {
      goTo(invalid);
      setAttempted(true);
      return;
    }
    confirm({
      title: 'Submit this request?',
      message: 'It goes to the product manager for approval straight away.',
      confirmLabel: 'Submit',
      icon: 'clipboard',
      onConfirm: () => {
        if (isPending) return;
        mutate(draft, { onSuccess: (detail) => setCreatedUuid(detail.pa_uuid) });
      },
    });
  };

  const saveItem = (item: DraftItem) => {
    setDraft((current) => ({
      ...current,
      items: current.items.some(({ id }) => id === item.id)
        ? current.items.map((existing) => (existing.id === item.id ? item : existing))
        : [...current.items, item],
    }));
    setEditing(null);
  };

  const failure = error ? toAppError(error) : null;
  const requester = user?.name ?? '';

  // The item form is a screen of its own, with its own pinned Save and Cancel.
  if (editing) {
    return (
      <Screen>
        <ItemForm
          title={draft.items.some(({ id }) => id === editing.id) ? 'Edit item' : 'New item'}
          initial={editing}
          onSave={saveItem}
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
          <DetailsStep draft={draft} onChange={update} errors={errors} />
        ) : step === 'items' ? (
          <ItemsStep
            items={draft.items}
            errors={errors}
            onAdd={() => setEditing(newItem())}
            onEdit={setEditing}
            onRemove={(item) =>
              confirm({
                title: 'Remove this item?',
                confirmLabel: 'Remove',
                destructive: true,
                onConfirm: () => update({ items: draft.items.filter(({ id }) => id !== item.id) }),
              })
            }
          />
        ) : step === 'attachments' ? (
          <AttachmentsStep
            attachments={draft.attachments}
            errors={errors}
            onChange={(attachments) => update({ attachments })}
          />
        ) : (
          <>
            <ReviewStep draft={draft} requester={requester} today={day} onEdit={goTo} />
            {failure ? (
              <Alert
                tone={failure.code === 'validation' ? 'danger' : 'warning'}
                message={
                  failure.code === 'validation' || failure.code === 'forbidden'
                    ? failure.message
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
            You are offline. Connect to submit.
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
            {last ? 'Submit request' : 'Next'}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
