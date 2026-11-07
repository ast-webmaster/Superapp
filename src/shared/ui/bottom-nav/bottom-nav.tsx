import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';
import { GlassSurface } from './glass-surface';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
}

/** Bottom padding a scroll area needs so its last item clears the floating tab bar. */
export function useBottomNavInset() {
  const { bottom } = useSafeAreaInsets();
  return bottom + sizes.tabBar + sizes.tabBarContentGap;
}

export interface BottomNavProps {
  /** At most four items. */
  items:
    | readonly [BottomNavItem]
    | readonly [BottomNavItem, BottomNavItem]
    | readonly [BottomNavItem, BottomNavItem, BottomNavItem]
    | readonly [BottomNavItem, BottomNavItem, BottomNavItem, BottomNavItem];
  activeKey: string;
  onChange: (key: string) => void;
  /** `floating` sits above the safe area at the bottom of the screen; `inline` stays in the flow. */
  placement?: 'floating' | 'inline';
  className?: string;
}

export function BottomNav({
  items,
  activeKey,
  onChange,
  placement = 'floating',
  className,
}: BottomNavProps) {
  const { bottom } = useSafeAreaInsets();
  const floating = placement === 'floating';

  return (
    <View
      role="navigation"
      className={clsx(floating && 'absolute right-5 left-5', className)}
      style={floating ? { bottom: bottom + sizes.tabBarOffset } : undefined}>
      <GlassSurface className="h-tabbar flex-row items-center gap-1 rounded-pill px-1">
        {items.map((item) => {
          const active = item.key === activeKey;

          return (
            <Pressable
              key={item.key}
              role="link"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item.key)}
              className={clsx(
                'h-16 min-w-0 flex-1 items-center justify-center rounded-pill',
                active ? 'bg-primary' : 'active:bg-surface-gray',
                focusRing,
              )}>
              <Icon name={item.icon} color={active ? 'on-primary' : 'ink'} />
              <AppText variant="label" tone={active ? 'on-primary' : 'ink'} numberOfLines={1}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </GlassSurface>
    </View>
  );
}
