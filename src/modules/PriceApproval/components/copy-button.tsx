import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { Icon, focusRing } from '@/shared/ui';

const CONFIRM_MS = 2000;

/** A copy icon. After a tap it shows a check for two seconds. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Pressable
      role="button"
      aria-label={copied ? 'Copied' : label}
      hitSlop={16}
      className={focusRing}
      onPress={async () => {
        if (await Clipboard.setStringAsync(text)) setCopied(true);
      }}>
      <Icon name={copied ? 'check' : 'copy'} size={16} color={copied ? 'success' : 'ink-muted'} />
    </Pressable>
  );
}
