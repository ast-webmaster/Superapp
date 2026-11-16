import { View } from 'react-native';

import { AppText, Button } from '@/shared/ui';

import type { ChatMessage } from '../types';
import { ReplyText } from './reply/reply-text';
import { AssistantShell } from './assistant-shell';

export interface AssistantCardProps {
  message: ChatMessage;
  /** Downloads the answer's data as Excel. Shown only when the server marks it exportable. */
  onExport?: () => void;
  exporting?: boolean;
}

/** One AI answer. The server's suggestions are deliberately not shown. */
export function AssistantCard({ message, onExport, exporting = false }: AssistantCardProps) {
  const assumptions = message.meta?.assumptions ?? [];
  return (
    <View className="gap-2">
      <AssistantShell>
        <ReplyText text={message.message} />
        {assumptions.length > 0 ? (
          <View className="gap-1">
            {assumptions.map((assumption, index) => (
              <AppText key={index} variant="caption" tone="muted">
                {assumption}
              </AppText>
            ))}
          </View>
        ) : null}
      </AssistantShell>
      {message.meta?.exportable && onExport ? (
        <Button
          variant="soft"
          iconLeft="download"
          loading={exporting}
          onPress={onExport}
          className="ml-8">
          Download Excel
        </Button>
      ) : null}
    </View>
  );
}
