import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radiusPill, sizes } from '@/shared/theme/tokens';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';
import { GlassSurface } from './glass-surface';

// These mirror the `px-2 gap-1` classes and `h-14` item height on the bar below.
const BAR_PADDING = 8;
const ITEM_GAP = 4;
const ITEM_HEIGHT = 56;

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

  // The active background is one pill that slides to the active item instead of each item
  // switching its own background.
  const [barWidth, setBarWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );
  const itemWidth =
    barWidth > 0 ? (barWidth - BAR_PADDING * 2 - ITEM_GAP * (items.length - 1)) / items.length : 0;
  const [offset] = useState(() => new Animated.Value(0));
  const placed = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (itemWidth === 0) return;
    const target = activeIndex * (itemWidth + ITEM_GAP);
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
  }, [activeIndex, itemWidth, offset, reduceMotion]);

  return (
    <View
      role="navigation"
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      className={clsx(floating && 'absolute right-5 left-5', className)}
      style={floating ? { bottom: bottom + sizes.tabBarOffset } : undefined}>
      <GlassSurface className="h-tabbar flex-row items-center gap-1 rounded-pill px-2">
        {/* The gradient lives inside the bar; everything around it keeps the screen background. */}
        <LinearGradient
          pointerEvents="none"
          colors={[colors['primary-soft'], colors.surface, colors.surface, colors['primary-soft']]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radiusPill }]}
        />
        {itemWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: BAR_PADDING,
                top: (sizes.tabBar - ITEM_HEIGHT) / 2,
                width: itemWidth,
                height: ITEM_HEIGHT,
                borderRadius: radiusPill,
                backgroundColor: colors.primary,
              },
              { transform: [{ translateX: offset }] },
            ]}
          />
        ) : null}
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
                'h-14 min-w-0 flex-1 items-center justify-center rounded-pill',
                !active && 'active:bg-surface-gray',
                focusRing,
              )}>
              <View>
                <Icon name={item.icon} color={active ? 'on-primary' : 'ink'} />
                {item.badge ? (
                  <View
                    testID={`${item.key}-badge`}
                    className="absolute -right-3 -top-2 h-5 min-w-5 items-center justify-center rounded-pill bg-danger px-1">
                    <AppText variant="label" tone="on-primary">
                      {item.badge > 99 ? '99+' : String(item.badge)}
                    </AppText>
                  </View>
                ) : null}
              </View>
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
