import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, focusRing, Icon } from '@/shared/ui';

export interface ClarifyChoicesProps {
  /** The server's options: each one is a complete question that can be sent as it is. */
  options: readonly string[];
  onChoose: (option: string) => void;
}

/** A, B, C… so the options can be told apart at a glance and read out. */
const letter = (index: number) => String.fromCharCode(65 + index);

/**
 * The AI could not tell what was meant and offers a few readings. One is picked, then sent;
 * typing a different question in the composer still works. Choice cards, not chips, because the
 * options are whole sentences and must not be sent by a single stray tap.
 */
export function ClarifyChoices({ options, onChoose }: ClarifyChoicesProps) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <View role="radiogroup" aria-label="Pick what you meant" className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="size-8 items-center justify-center rounded-pill bg-primary-soft">
          <Icon name="ai" color="primary" />
        </View>
        <View className="min-w-0 flex-1">
          <AppText variant="body-strong">Pick what you meant</AppText>
          <AppText variant="caption" tone="muted">
            Or type your own question below.
          </AppText>
        </View>
      </View>
      <View className="gap-2">
        {options.map((option, index) => {
          const selected = option === picked;
          return (
            <Pressable
              key={option}
              role="radio"
              accessible
              aria-label={option}
              aria-checked={selected}
              accessibilityState={{ checked: selected }}
              onPress={() => setPicked(option)}
              className={clsx(
                'min-h-touch flex-row items-center gap-3 rounded-lg border px-3 py-2',
                selected
                  ? 'border-ink bg-ink'
                  : 'border-border bg-surface active:bg-surface-gray',
                focusRing,
              )}>
              <View
                aria-hidden
                className={clsx(
                  'size-7 items-center justify-center rounded-sm',
                  selected ? 'bg-surface' : 'bg-surface-gray',
                )}>
                <AppText variant="caption-strong" tone={selected ? 'ink' : 'muted'}>
                  {letter(index)}
                </AppText>
              </View>
              <AppText tone={selected ? 'on-primary' : 'ink'} className="min-w-0 flex-1">
                {option}
              </AppText>
              {selected ? <Icon name="check" color="on-primary" /> : null}
            </Pressable>
          );
        })}
      </View>
      <Button
        block
        iconRight="arrow-right"
        disabled={picked === null}
        onPress={() => {
          if (picked !== null) onChoose(picked);
        }}>
        Send answer
      </Button>
    </View>
  );
}
