import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, focusRing } from '@/shared/ui';

export interface ClarifyChoicesProps {
  /** The server's options: each one is a complete question that can be sent as it is. */
  options: readonly string[];
  onChoose: (option: string) => void;
}

/**
 * The AI could not tell what was meant and offers a few readings. One is picked, then sent;
 * typing a different question in the composer still works. Radio rows, not chips, because the
 * options are whole sentences and must not be sent by a single stray tap.
 */
export function ClarifyChoices({ options, onChoose }: ClarifyChoicesProps) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <View role="radiogroup" aria-label="Choose one" className="gap-2">
      <AppText variant="caption" tone="muted">
        Pick one, or type your own below.
      </AppText>
      {options.map((option) => {
        const selected = option === picked;
        return (
          <Pressable
            key={option}
            role="radio"
            accessible
            aria-checked={selected}
            accessibilityState={{ checked: selected }}
            onPress={() => setPicked(option)}
            className={clsx(
              'min-h-touch flex-row items-center gap-3 rounded-lg border px-3 py-2',
              selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
              focusRing,
            )}>
            <View
              className={clsx(
                'size-5 items-center justify-center rounded-pill border-2',
                selected ? 'border-primary' : 'border-border',
              )}>
              {selected ? <View className="size-2.5 rounded-pill bg-primary" /> : null}
            </View>
            <AppText className="min-w-0 flex-1">{option}</AppText>
          </Pressable>
        );
      })}
      <Button
        variant="soft"
        disabled={picked === null}
        onPress={() => {
          if (picked !== null) onChoose(picked);
        }}>
        Send answer
      </Button>
    </View>
  );
}
