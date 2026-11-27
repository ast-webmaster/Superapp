import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radiusPill, sizes } from '@/shared/theme/tokens';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

// These mirror the `px-2 gap-2` classes and the `size-control` circles on the bar below.
const BAR_PADDING = 8;
const ITEM_GAP = 8;
const ITEM_SIZE = 56;

export interface BottomNavItem {
  key: string;
  /** Not drawn: names the button for screen readers. */
  label: string;
  icon: IconName;
  /** Unread count shown on the icon. Hidden when 0 or missing. */
  badge?: number;
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

  // The active background is one white circle that slides to the active item instead of each
  // item switching its own background.
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );
  const [offset] = useState(() => new Animated.Value(0));
  const placed = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    const target = activeIndex * (ITEM_SIZE + ITEM_GAP);
    if (!placed.current || reduceMotion) {
      // Jump to the first position, then slide on every change after it.
      offset.setValue(target);
    } else {
      Animated.timing(offset, {
        toValue: target,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    placed.current = true;
  }, [activeIndex, offset, reduceMotion]);

  return (
    <View
      role="navigation"
      className={clsx('items-center', floating && 'absolute inset-x-0', className)}
      style={floating ? { bottom: bottom + sizes.tabBarOffset } : undefined}>
      {/* A dark capsule floating on the ground: one round button per item, no visible labels.
          Layers, bottom to top: the gray circles, the sliding white circle, the icons. */}
      <View className="h-tabbar flex-row items-center gap-2 rounded-pill bg-ink-raised px-2 shadow-glass">
        <View pointerEvents="none" className="absolute inset-0 flex-row items-center gap-2 px-2">
          {items.map((item) => (
            <View key={item.key} className="size-control rounded-pill bg-ink-line" />
          ))}
        </View>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: BAR_PADDING,
            top: (sizes.tabBar - ITEM_SIZE) / 2,
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            borderRadius: radiusPill,
            backgroundColor: colors.surface,
            transform: [{ translateX: offset }],
          }}>
          {/* A count already marks that corner, so the dot gives way to it. */}
          {items[activeIndex]?.badge ? null : (
            <View
              testID="active-dot"
              className="absolute right-0.5 top-0.5 size-3 rounded-pill bg-accent"
            />
          )}
        </Animated.View>
        {items.map((item) => {
          const active = item.key === activeKey;

          return (
            <Pressable
              key={item.key}
              role="link"
              aria-label={item.badge ? `${item.label}, ${item.badge} unread` : item.label}
              aria-current={active ? 'page' : undefined}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item.key)}
              className={clsx('size-control items-center justify-center rounded-pill', focusRing)}>
              <Icon name={item.icon} size={22} color={active ? 'ink' : 'on-primary'} />
              {item.badge ? (
                <View
                  testID={`${item.key}-badge`}
                  className="absolute right-0 top-0 h-5 min-w-5 items-center justify-center rounded-pill border-2 border-ink-raised bg-danger px-1">
                  <AppText variant="label" tone="on-primary">
                    {item.badge > 99 ? '99+' : String(item.badge)}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
