import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';

import { IconButton } from '../icon-button/icon-button';
import type { IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface TopAppBarAction {
  icon: IconName;
  /** What the button does, for screen readers. */
  label: string;
  onPress: () => void;
}

export interface TopAppBarProps {
  title: string;
  /** Shows the round back button on the left. Leave it out on a screen that is a tab. */
  onBack?: () => void;
  /** One round button on the right, such as a filter. */
  action?: TopAppBarAction;
}

/**
 * The bar at the top of every screen: a round back button, the title centered, one round action
 * on the right. It sits straight on the screen ground, not on a white block, and pads the status
 * bar itself. Both side slots are 48 wide, so the title stays centered whether or not they are used.
 */
export function TopAppBar({ title, onBack, action }: TopAppBarProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center gap-2 px-5 pb-4"
      style={{ paddingTop: top + sizes.screenTopGap }}>
      <View className="size-touch">
        {onBack ? <IconButton size="sm" icon="chevron-left" label="Back" onPress={onBack} /> : null}
      </View>
      <AppText
        variant="heading"
        role="heading"
        numberOfLines={1}
        className="min-w-0 flex-1 text-center">
        {title}
      </AppText>
      <View className="size-touch">
        {action ? (
          <IconButton size="sm" icon={action.icon} label={action.label} onPress={action.onPress} />
        ) : null}
      </View>
    </View>
  );
}

/** The parts of a stack header's props that `renderTopAppBar` reads, so shared/ui needs no navigation types. */
interface StackHeaderProps {
  options: { title?: string };
  /** Set when there is a screen to go back to. */
  back?: unknown;
  navigation: { goBack: () => void };
}

/** Use as a stack's `header` option: every pushed screen gets the same bar, with back when it can. */
export function renderTopAppBar({ options, back, navigation }: StackHeaderProps) {
  return (
    <TopAppBar title={options.title ?? ''} onBack={back ? () => navigation.goBack() : undefined} />
  );
}
