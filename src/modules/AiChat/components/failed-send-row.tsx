import { View } from 'react-native';

import { AppText, Button, Icon } from '@/shared/ui';

export interface FailedSendRowProps {
  /** The server's reason when it refused the message. Without it the outcome is unknown. */
  error?: string;
  onRestore: () => void;
}

/** Under the conversation when a message did not, or may not, have arrived. Never resends by itself. */
export function FailedSendRow({ error, onRestore }: FailedSendRowProps) {
  return (
    <View className="items-end gap-2" role="alert" accessible>
      <View className="flex-row items-center gap-2">
        <Icon name="alert" size={16} color="danger" />
        <AppText variant="caption" tone="danger" className="shrink">
          {error ?? 'Your message may not have been sent. Try again.'}
        </AppText>
      </View>
      <Button variant="secondary" iconLeft="pencil" onPress={onRestore}>
        Edit and resend
      </Button>
    </View>
  );
}
