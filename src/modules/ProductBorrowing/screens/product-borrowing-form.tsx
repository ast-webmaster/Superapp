import { router, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ActionBar, Alert, AppText, Button, Screen, useConfirm } from '@/shared/ui';

import { DetailsStep } from '../components/create/details-step';
import { ItemForm } from '../components/create/item-form';
import { ItemsStep, itemName } from '../components/create/items-step';
import { ReviewStep } from '../components/create/review-step';
import { StepIndicator } from '../components/create/step-indicator';
import {
  firstInvalidStep,
  isDirty,
  newItem,
  STEPS,
  submitFailureMessage,
  validateStep,
  type StepKey,
} from '../create/draft';
import { useSubmitProductBorrowing } from '../hooks/use-submit-product-borrowing';
import { productBorrowingRoutes } from '../navigation/routes';
import type { DraftItem, ProductBorrowingDraft, ProductBorrowingOptions } from '../types';

export interface ProductBorrowingFormProps {
  options: ProductBorrowingOptions;
  /** What the form starts with: empty for a new borrowing, the server's copy for a resubmit. */
  initial: ProductBorrowingDraft;
  /** Set to resubmit this document, filled in from the version with this `updatedAt`. */
  resubmit?: { uuid: string; updatedAt: string };
}

/** The stepped form behind both a new borrowing and the resubmit of one that was sent back. */
export function ProductBorrowingForm({ options, initial, resubmit }: ProductBorrowingFormProps) {
  const confirm = useConfirm();
  const navigation = useNavigation();
  const online = useIsOnline();
  const { mutate, isPending, error, reset } = useSubmitProductBorrowing(resubmit);

  const [draft, setDraft] = useState<ProductBorrowingDraft>(initial);
  const [stepIndex, setStepIndex] = useState(0);
  // Errors stay hidden until the user tries to continue, so a fresh step is not red.
  const [attempted, setAttempted] = useState(false);
  const [editing, setEditing] = useState<DraftItem | null>(null);
  const [savedUuid, setSavedUuid] = useState<string | null>(null);

  const step: StepKey = STEPS[stepIndex]?.key ?? 'details';
  const last = stepIndex === STEPS.length - 1;
  const errors = attempted ? validateStep(step, draft) : {};

  // Leaving with work in the form asks first. Once the server has saved it, nothing is lost.
  usePreventRemove(isDirty(draft, initial) && savedUuid === null, ({ data }) =>
    confirm({
      title: resubmit ? 'Discard your changes?' : 'Discard this borrowing?',
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
    // A new borrowing replaces the form; a resubmit goes back to the document it was opened from.
    if (resubmit) router.dismissTo(productBorrowingRoutes.detail(savedUuid) as never);
    else router.replace(productBorrowingRoutes.detail(savedUuid) as never);
  }, [savedUuid, resubmit]);

  const update = (patch: Partial<ProductBorrowingDraft>) => {
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
      title: resubmit ? 'Resubmit this borrowing?' : 'Submit this borrowing?',
      message: resubmit
        ? 'Your changes replace what was sent, and the approval starts again from the first step.'
        : 'It goes into the approval flow straight away.',
      confirmLabel: resubmit ? 'Resubmit' : 'Submit',
      icon: 'clipboard',
      onConfirm: () => {
        if (isPending) return;
        mutate(draft, { onSuccess: (detail) => setSavedUuid(detail.uuid) });
      },
    });
  };

  const failure = error ? toAppError(error) : null;

  // An item form is a screen of its own, with its own pinned Save and Cancel.
  if (editing) {
    const exists = draft.items.some(({ id }) => id === editing.id);
    return (
      <Screen>
        <ItemForm
          title={exists ? 'Edit item' : 'New item'}
          initial={editing}
          options={options}
          others={draft.items.filter(({ id }) => id !== editing.id)}
          onSave={(item) => {
            update({
              items: exists
                ? draft.items.map((row) => (row.id === item.id ? item : row))
                : [...draft.items, item],
            });
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
          <DetailsStep draft={draft} onChange={update} errors={errors} />
        ) : step === 'items' ? (
          <ItemsStep
            items={draft.items}
            errors={errors}
            onAdd={() => setEditing(newItem())}
            onEdit={setEditing}
            onRemove={(row) =>
              confirm({
                title: 'Remove this item?',
                message: itemName(row),
                confirmLabel: 'Remove',
                destructive: true,
                onConfirm: () => update({ items: draft.items.filter(({ id }) => id !== row.id) }),
              })
            }
          />
        ) : (
          <>
            <ReviewStep draft={draft} onEdit={goTo} />
            {failure ? (
              <Alert
                tone={failure.code === 'validation' ? 'danger' : 'warning'}
                message={
                  failure.code === 'validation' ||
                  failure.code === 'forbidden' ||
                  failure.code === 'conflict'
                    ? submitFailureMessage(failure)
                    : `${failure.message} Check the borrowing list before you send it again.`
                }
              />
            ) : null}
          </>
        )}
      </ScrollView>
      <ActionBar>
        {last && !online ? (
          <AppText variant="caption" tone="muted">
            {`You are offline. Connect to ${resubmit ? 'resubmit' : 'submit'}.`}
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
            {last ? (resubmit ? 'Resubmit borrowing' : 'Submit borrowing') : 'Next'}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
