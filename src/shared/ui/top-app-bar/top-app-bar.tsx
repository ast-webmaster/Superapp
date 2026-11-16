import { useState, type ReactNode } from 'react';
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
  /** On, such as search while a query is set. */
  active?: boolean;
  disabled?: boolean;
}

export interface TopAppBarProps {
  title: string;
  /** Shows the round back button on the left. Leave it out on a screen that is a tab. */
  onBack?: () => void;
  /**
   * Round buttons on the right, such as history and new chat. The bar draws them at the header
   * size (`IconButton size="sm"`: a 40 circle in a 48 press area), so every screen matches.
   */
  actions?: readonly TopAppBarAction[];
  /**
   * A custom right slot, for a stack's `headerRight`. Wins over `actions`. Buttons in it use
   * `IconButton size="sm"`, the same as `actions`.
   */
  right?: ReactNode;
}

/**
 * The bar at the top of every screen: a round back button, the title centered, round actions
 * on the right. It sits straight on the screen ground, not on a white block, and pads the status
 * bar itself. Both side slots are at least 48 wide and the left one grows to match the right, so
 * the title stays centered whether the right holds nothing, one button or several.
 */
export function TopAppBar({ title, onBack, actions = [], right }: TopAppBarProps) {
  const { top } = useSafeAreaInsets();
  // The left slot copies the right one's width so the title stays centered with two buttons.
  const [rightWidth, setRightWidth] = useState(0);

  return (
    <View
      className="flex-row items-center gap-2 px-5 pb-4"
      style={{ paddingTop: top + sizes.screenTopGap }}>
      <View
        className="min-h-touch min-w-touch"
        style={rightWidth ? { width: rightWidth } : undefined}>
        {onBack ? <IconButton size="sm" icon="chevron-left" label="Back" onPress={onBack} /> : null}
      </View>
      <AppText
        variant="heading"
        role="heading"
        numberOfLines={1}
        className="min-w-0 flex-1 text-center">
        {title}
      </AppText>
      <View
        className="min-h-touch min-w-touch flex-row items-center justify-end"
        onLayout={(event) => setRightWidth(event.nativeEvent.layout.width)}>
        {right ??
          actions.map((action) => (
            <IconButton
              key={action.label}
              size="sm"
              icon={action.icon}
              label={action.label}
              active={action.active}
              disabled={action.disabled}
              onPress={action.onPress}
            />
          ))}
      </View>
    </View>
  );
}

/** The parts of a stack header's props that `renderTopAppBar` reads, so shared/ui needs no navigation types. */
interface StackHeaderProps {
  options: {
    title?: string;
    headerRight?: (props: { canGoBack: boolean; tintColor?: string }) => ReactNode;
  };
  /** Set when there is a screen to go back to. */
  back?: unknown;
  navigation: { goBack: () => void };
}

/** Use as a stack's `header` option: every pushed screen gets the same bar, with back when it can. */
export function renderTopAppBar({ options, back, navigation }: StackHeaderProps) {
  return (
    <TopAppBar
      title={options.title ?? ''}
      onBack={back ? () => navigation.goBack() : undefined}
      right={options.headerRight?.({ canGoBack: Boolean(back) })}
    />
  );
}
