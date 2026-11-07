import { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';

const LazyBoard = lazy(() => import('./board-screen'));
const LazyDemo = lazy(() => import('./demo-screen'));

function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-gray">
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function DesignSystemBoardScreen() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyBoard />
    </Suspense>
  );
}

export function DesignSystemDemoScreen() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyDemo />
    </Suspense>
  );
}
