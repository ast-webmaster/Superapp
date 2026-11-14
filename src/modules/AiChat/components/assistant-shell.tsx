import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AiAvatar } from './ai-avatar';

/** The white card of an AI answer, with the AI mark at its lower left. */
export function AssistantShell({ children }: { children: ReactNode }) {
  return (
    <View className="flex-row items-end gap-2 pr-8">
      <AiAvatar />
      <View className="shrink gap-3 rounded-xl border border-border bg-surface p-4">
        {children}
      </View>
    </View>
  );
}
