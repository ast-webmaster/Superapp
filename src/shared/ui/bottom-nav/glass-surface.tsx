import { clsx } from 'clsx';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { radiusPill } from '@/shared/theme/tokens';

interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
}

function canUseGlass() {
  return Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
}

/** Liquid glass on iOS 26 and later. Everywhere else, and with reduced transparency, solid surface. */
export function GlassSurface({ children, className }: GlassSurfaceProps) {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const glass = canUseGlass() && !reduceTransparency;

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
      if (active) setReduceTransparency(enabled);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View className={clsx('shadow-glass', !glass && 'bg-surface', className)}>
      {/* GlassView takes no class names, so it is a background layer behind the content. */}
      {glass ? (
        <GlassView
          glassEffectStyle="regular"
          style={[StyleSheet.absoluteFill, { borderRadius: radiusPill }]}
        />
      ) : null}
      {children}
    </View>
  );
}
