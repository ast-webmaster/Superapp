import { clsx } from 'clsx';
import { View } from 'react-native';

import { AppText } from '@/shared/ui';
import { formatCompactMoney, formatMoney } from '@/shared/utils/format';

import type { Bar } from '../series';
import { Reveal } from './reveal';

const MAX_HEIGHT = 112;
/** A day without sales still shows where it is. */
const MIN_HEIGHT = 8;
/** One stripe and the gap under it. */
const STRIPE = 16;
/** Room for the value above the latest bar. */
const VALUE_HEIGHT = 24;

/**
 * One chunky rounded bar per day. A day that reached its target is olive and striped (the stripes
 * say it without color), the rest are gray. The latest bar carries its value.
 */
export function DayBars({ bars, onDark = false }: { bars: Bar[]; onDark?: boolean }) {
  const quiet = onDark ? 'on-ink-muted' : 'muted';
  const max = Math.max(...bars.map((bar) => bar.value), 0);

  return (
    <View
      accessible
      role="img"
      aria-label={`Recent sales. ${bars
        .map((bar) => `${bar.name} ${formatMoney(bar.value)}${bar.hit ? ', target reached' : ''}`)
        .join('; ')}`}
      className="gap-2">
      <Reveal>
        <View className="flex-row items-end gap-2">
          {bars.map((bar, index) => {
            const latest = index === bars.length - 1;
            const height =
              max > 0
                ? Math.max((Math.max(bar.value, 0) / max) * MAX_HEIGHT, MIN_HEIGHT)
                : MIN_HEIGHT;

            return (
              <View key={bar.key} className="flex-1 items-center gap-2">
                <View className="w-full justify-end" style={{ height: MAX_HEIGHT + VALUE_HEIGHT }}>
                  {latest ? (
                    // Wider than its bar, so a long amount is not cut off.
                    <View className="-mx-5 items-center pb-1">
                      <AppText
                        variant="caption-strong"
                        tone={onDark ? 'on-primary' : 'ink'}
                        numberOfLines={1}>
                        {formatCompactMoney(bar.value)}
                      </AppText>
                    </View>
                  ) : null}
                  <View
                    testID={bar.hit ? 'bar-hit' : 'bar'}
                    className={clsx(
                      'w-full overflow-hidden rounded-md',
                      bar.hit ? 'bg-accent' : 'bg-primary-soft',
                    )}
                    style={{ height }}>
                    {bar.hit
                      ? Array.from({ length: Math.ceil(height / STRIPE) }, (_, stripe) => (
                          <View
                            key={stripe}
                            className="absolute inset-x-0 h-2 bg-accent-soft"
                            style={{ top: stripe * STRIPE + 8 }}
                          />
                        ))
                      : null}
                  </View>
                </View>
                <AppText variant="label" tone={quiet} numberOfLines={1}>
                  {bar.label}
                </AppText>
              </View>
            );
          })}
        </View>
      </Reveal>
      {bars.some((bar) => bar.hit) ? (
        <AppText variant="label" tone={quiet} className="text-center">
          Striped days reached the daily target
        </AppText>
      ) : null}
    </View>
  );
}
