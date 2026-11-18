import { View } from 'react-native';

import { AppText, Chip } from '@/shared/ui';

export interface SuggestionChipsProps {
  /** Shown above the chips, for example "Follow-up questions". */
  label: string;
  /** The server's suggestions: each one is a complete question that can be sent as it is. */
  suggestions: readonly string[];
  onChoose: (suggestion: string) => void;
}

/** Questions to ask next. One tap sends the chip's text as the user's message. */
export function SuggestionChips({ label, suggestions, onChoose }: SuggestionChipsProps) {
  return (
    <View className="gap-2">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View role="group" aria-label={label} className="flex-row flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            className="max-w-full"
            onPress={() => onChoose(suggestion)}
          />
        ))}
      </View>
    </View>
  );
}
