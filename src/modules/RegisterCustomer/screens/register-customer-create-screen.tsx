import { router, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ActionBar, Alert, AppText, Button, Screen, useConfirm } from '@/shared/ui';

import { ContactStep } from '../components/create/contact-step';
import { CustomerStep } from '../components/create/customer-step';
import { DocumentsStep } from '../components/create/documents-step';
import { ReviewStep } from '../components/create/review-step';
import { StepIndicator } from '../components/create/step-indicator';
import {
  emptyDraft,
  firstInvalidStep,
  isDirty,
  STEPS,
  validateStep,
  type StepKey,
} from '../create/draft';
import { useCreateRegisterCustomer } from '../hooks/use-create-register-customer';
import { registerCustomerRoutes } from '../navigation/routes';
import type { RegisterCustomerDraft } from '../types';

export function RegisterCustomerCreateScreen() {
  const confirm = useConfirm();
  const online = useIsOnline();
  const { mutateAsync, isPending, error, reset } = useCreateRegisterCustomer();

  const [draft, setDraft] = useState<RegisterCustomerDraft>(emptyDraft);
  const [stepIndex, setStepIndex] = useState(0);
  // Errors stay hidden until the user tries to continue, so a fresh step is not red.
  const [attempted, setAttempted] = useState(false);
  const [createdUuid, setCreatedUuid] = useState<string | null>(null);

  const step: StepKey = STEPS[stepIndex]?.key ?? 'customer';
  const last = stepIndex === STEPS.length - 1;
  const errors = attempted ? validateStep(step, draft) : {};

  // Leaving with work in the form asks first. Once the server has saved it, nothing is lost.
  usePreventRemove(isDirty(draft) && createdUuid === null, ({ repeat }) =>
    confirm({
      title: 'Discard this registration?',
      message: 'What you entered will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      icon: 'alert',
      destructive: true,
      onConfirm: repeat,
    }),
  );

  useEffect(() => {
    if (createdUuid) router.replace(registerCustomerRoutes.detail(createdUuid) as never);
  }, [createdUuid]);

  const update = (patch: Partial<RegisterCustomerDraft>) => {
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
      title: 'Submit this registration?',
      message: 'It goes to approval straight away.',
      confirmLabel: 'Submit',
      icon: 'users',
      success: { title: 'Registration submitted' },
      onConfirm: () => {
        if (isPending) return;
        return mutateAsync(draft).then((detail) => setCreatedUuid(detail.uuid));
      },
    });
  };

  const failure = error ? toAppError(error) : null;

  return (
    <Screen>
      <StepIndicator current={stepIndex} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-5 pb-6 pt-2">
        {step === 'customer' ? (
          <CustomerStep draft={draft} onChange={update} errors={errors} />
        ) : step === 'contact' ? (
          <ContactStep draft={draft} onChange={update} errors={errors} />
        ) : step === 'documents' ? (
          <DocumentsStep draft={draft} onChange={update} errors={errors} />
        ) : (
          <>
            <ReviewStep draft={draft} onEdit={goTo} />
            {failure ? (
              <Alert
                tone={failure.code === 'validation' ? 'danger' : 'warning'}
                message={
                  failure.code === 'validation' || failure.code === 'forbidden'
                    ? failure.message
                    : `${failure.message} Check the registration list before you send it again.`
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
              onPress={() => goTo(STEPS[stepIndex - 1]?.key ?? 'customer')}>
              Back
            </Button>
          ) : null}
          <Button
            block
            className="flex-2"
            loading={isPending}
            disabled={last && !online}
            onPress={last ? submit : next}>
            {last ? 'Submit registration' : 'Next'}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
