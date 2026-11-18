import { View } from 'react-native';

import { AppText, Button } from '@/shared/ui';

import type { ChatMessage } from '../types';
import { ReplyText } from './reply/reply-text';
import { AssistantShell } from './assistant-shell';
import { ClarifyChoices } from './clarify-choices';

export interface AssistantCardProps {
  message: ChatMessage;
  /** Downloads the answer's data as Excel. Shown only when the server marks it exportable. */
  onExport?: () => void;
  exporting?: boolean;
  /**
   * Sends the option picked for a clarifying question. Pass it only while the question is still
   * open (the newest message, nothing in flight); without it the options are not shown.
   */
  onChoose?: (option: string) => void;
}

/**
 * One AI answer. The server's suggestions are shown only as the options of a clarifying
 * question (`meta.type` is `clarify`); follow-up suggestions are deliberately left out.
 */
export function AssistantCard({
  message,
  onExport,
  exporting = false,
  onChoose,
}: AssistantCardProps) {
  const assumptions = message.meta?.assumptions ?? [];
  const options = message.meta?.type === 'clarify' ? (message.meta.suggestions ?? []) : [];
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
        {onChoose && options.length > 0 ? (
          <ClarifyChoices options={options} onChoose={onChoose} />
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
