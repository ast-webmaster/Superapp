import { useIsOnline } from '@/shared/hooks/use-is-online';
import { IconButton } from '@/shared/ui';

import type { VoiceInput } from './use-voice-input';

/** Starts and stops voice input. Not shown where the device cannot turn speech into text. */
export function MicButton({ voice }: { voice: VoiceInput }) {
  const online = useIsOnline();
  if (!voice.supported) return null;
  return (
    <IconButton
      icon="mic"
      size="sm"
      active={voice.listening}
      disabled={!online && !voice.listening}
      label={voice.listening ? 'Stop listening' : 'Start voice input'}
      onPress={() => (voice.listening ? voice.stop() : void voice.start())}
    />
  );
}
