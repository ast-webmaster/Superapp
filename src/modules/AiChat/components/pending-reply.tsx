import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Icon } from '@/shared/ui';

import type { ProgressStep } from '../types';
import { AssistantShell } from './assistant-shell';

function StepMark({ status }: { status: ProgressStep['status'] }) {
  if (status === 'success') return <Icon name="check" size={16} color="success" />;
  if (status === 'error') return <Icon name="x" size={16} color="danger" />;
  return <ActivityIndicator size="small" color={colors.primary} />;
}

/** The AI's card while it works: the steps the server reports, as they happen. */
export function PendingReply({ steps }: { steps: ProgressStep[] }) {
  return (
    <AssistantShell>
      <View className="gap-2" aria-live="polite">
        {steps.length === 0 ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color={colors.primary} />
            <AppText tone="muted">Thinking</AppText>
          </View>
        ) : (
          steps.map((step) => (
            <View key={step.key} className="flex-row items-center gap-2">
              <StepMark status={step.status} />
              <AppText
                variant={step.status === 'running' ? 'body-strong' : 'body'}
                tone={
                  step.status === 'error' ? 'danger' : step.status === 'success' ? 'muted' : 'ink'
                }
                className="shrink">
                {step.label}
              </AppText>
            </View>
          ))
        )}
      </View>
    </AssistantShell>
  );
}
