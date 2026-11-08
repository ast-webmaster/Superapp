import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../icon-button/icon-button';
import { AppText } from '../text/text';

export interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Pinned under the scrolling content, such as an "Apply" button. */
  footer?: ReactNode;
}

/** A bottom sheet over a dimmed screen. Tapping the dim area or the close button closes it. */
export function Sheet({ visible, title, onClose, children, footer }: SheetProps) {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 items-center justify-end bg-scrim" style={{ paddingTop: top }}>
        <Pressable
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          className="absolute inset-0"
          onPress={onClose}
        />
        <View
          role="dialog"
          aria-modal
          aria-label={title}
          className="max-h-full w-full max-w-phone rounded-t-xl bg-surface"
          style={{ paddingBottom: bottom }}>
          <View className="flex-row items-center gap-3 px-5 py-4">
            <IconButton icon="x" label="Close" onPress={onClose} />
            <AppText variant="title" role="heading" className="min-w-0 flex-1">
              {title}
            </AppText>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            className="shrink"
            contentContainerClassName="gap-4 px-5 pb-4">
            {children}
          </ScrollView>
          {footer ? <View className="px-5 pb-4 pt-2">{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
