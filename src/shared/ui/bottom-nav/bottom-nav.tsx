import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radiusPill, sizes } from '@/shared/theme/tokens';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

// These mirror the `px-4 gap-1` classes and the `h-14 w-17` item on the bar below.
const BAR_PADDING = 16;
const ITEM_GAP = 4;
const ITEM_WIDTH = 68;
/**
 * The active pill holds the icon and its label together. It is as wide as the item, so the
 * longest label ("AI chat") keeps 11px each side, and 10px short of the bar top and bottom,
 * so its ends follow the bar's own curve.
 */
const PILL_WIDTH = ITEM_WIDTH;
const PILL_HEIGHT = 52;

export interface BottomNavItem {
  key: string;
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
    const target = activeIndex * (ITEM_WIDTH + ITEM_GAP);
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
      {/* A dark bar floating on the ground. The active item is one accent pill holding its icon and its label, both black. */}
      <View className="h-tabbar flex-row items-center gap-1 rounded-pill bg-ink px-4 shadow-glass">
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: BAR_PADDING + (ITEM_WIDTH - PILL_WIDTH) / 2,
            top: (sizes.tabBar - PILL_HEIGHT) / 2,
            width: PILL_WIDTH,
            height: PILL_HEIGHT,
            borderRadius: radiusPill,
            backgroundColor: colors.accent,
            transform: [{ translateX: offset }],
          }}
        />
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
              className={clsx(
                'h-14 w-17 items-center justify-center gap-0.5 rounded-pill',
                focusRing,
              )}>
              <View className="size-6 items-center justify-center">
                <Icon name={item.icon} size={22} color={active ? 'ink' : 'on-ink-muted'} />
                {item.badge ? (
                  <View
                    testID={`${item.key}-badge`}
                    className="absolute -right-2 -top-2 h-5 min-w-5 items-center justify-center rounded-pill border-2 border-ink bg-danger px-1">
                    <AppText variant="label" tone="on-primary">
                      {item.badge > 99 ? '99+' : String(item.badge)}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText variant="label" tone={active ? 'ink' : 'on-ink-muted'} numberOfLines={1}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
