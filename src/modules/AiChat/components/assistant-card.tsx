import { View } from 'react-native';

import { AppText, Button } from '@/shared/ui';

import type { ChatMessage } from '../types';
import { ReplyText } from './reply/reply-text';
import { AssistantShell } from './assistant-shell';
import { ClarifyChoices } from './clarify-choices';
import { SuggestionChips } from './suggestion-chips';

/** The AI could not answer: its suggestions are examples of what it can. */
const CANNOT_ANSWER = ['denied', 'unanswerable'];

export interface AssistantCardProps {
  message: ChatMessage;
  /** Downloads the answer's data as Excel. Shown only when the server marks it exportable. */
  onExport?: () => void;
  exporting?: boolean;
  /**
   * Sends the option picked for a clarifying question, or the tapped follow-up suggestion. Pass it
   * only while the answer is still open (the newest message, nothing in flight); without it
   * neither the options nor the suggestions are shown.
   */
  onChoose?: (option: string) => void;
}

/**
 * One AI answer. The server's suggestions are shown by `meta.type`: the options of a clarifying
 * question (`clarify`, radio rows inside the card), or chips under the card with follow-up
 * questions, or examples of what can be asked when the AI could not answer.
 */
export function AssistantCard({
  message,
  onExport,
  exporting = false,
  onChoose,
}: AssistantCardProps) {
  const assumptions = message.meta?.assumptions ?? [];
  const type = message.meta?.type;
  const suggestions = message.meta?.suggestions ?? [];
  const options = type === 'clarify' ? suggestions : [];
  const chips = type === 'clarify' ? [] : suggestions;
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
      {onChoose && chips.length > 0 ? (
        <View className="ml-8">
          <SuggestionChips
            label={type && CANNOT_ANSWER.includes(type) ? 'Try asking:' : 'Follow-up questions'}
            suggestions={chips}
            onChoose={onChoose}
          />
        </View>
      ) : null}
      {message.meta?.exportable && onExport ? (
        <Button
          variant="soft"
          size="sm"
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
