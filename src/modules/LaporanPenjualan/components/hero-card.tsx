import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { ColorToken } from '@/shared/theme/tokens';
import { AppText, Icon, type AppTextProps, type BadgeProps } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import type { AchievementLevel } from '../types';
import { Amount } from './amount';
import { Meter } from './charts/meter';
import { Sparkline } from './charts/sparkline';
import { DeltaChip } from './delta-chip';
import { levelTrend, type Trend } from './level';

/** The line, the bar and the dot of a trend on the dark card. Flat uses the soft brand blue. */
const trendColor: Record<Trend, ColorToken> = {
  gain: 'gain',
  flat: 'highlight',
  loss: 'loss',
};

export type HeroStat = { label: string; value: number };

export interface HeroCardProps {
  /** What the number is, such as "Total sales · October 2026". */
  eyebrow: string;
  /** A small pill beside the eyebrow, such as "12 days left". */
  badge?: string;
  amount: number;
  target: number;
  /** Share of the target reached. */
  percentage: number;
  level: AchievementLevel;
  /** Running total, oldest first, for the sparkline. Empty draws none. */
  series: number[];
  /** Small figures under the bar, two to a row. */
  stats: HeroStat[];
  /** The level, as the last tile after the figures: a card in the level's own color. */
  status?: Pick<BadgeProps, 'label' | 'tone' | 'icon'>;
}

const tile = 'min-w-0 flex-1 gap-1 rounded-lg bg-ink-raised p-3';

/** The fill and text of a status card: the same pairs the `Badge` tones use. */
const statusTones = {
  neutral: { card: 'bg-surface-gray', text: 'ink', icon: 'ink' },
  info: { card: 'bg-primary-soft', text: 'primary', icon: 'primary' },
  blue: { card: 'bg-blue-soft', text: 'blue', icon: 'blue' },
  success: { card: 'bg-success-bg', text: 'success', icon: 'success' },
  danger: { card: 'bg-danger-bg', text: 'danger', icon: 'danger' },
  warning: { card: 'bg-warning-bg', text: 'warning', icon: 'warning' },
} as const satisfies Record<
  NonNullable<BadgeProps['tone']>,
  { card: string; text: AppTextProps['tone']; icon: ColorToken }
>;

/** Two tiles to a row; a last tile on its own takes the full width. */
function rows(tiles: ReactNode[]): ReactNode[][] {
  return Array.from({ length: Math.ceil(tiles.length / 2) }, (_, index) =>
    tiles.slice(index * 2, index * 2 + 2),
  );
}

/**
 * The headline of a report, as a market card: a dark `ink` card with one big amount, how far it
 * is from the target as an up/down chip, the running total as a sparkline, and a progress bar.
 */
export function HeroCard({
  eyebrow,
  badge,
  amount,
  target,
  percentage,
  level,
  series,
  stats,
  status,
}: HeroCardProps) {
  const color = trendColor[levelTrend(level)];
  const tiles = [
    ...stats.map((stat) => (
      <View key={stat.label} className={tile}>
        <AppText variant="label" tone="on-ink-muted" numberOfLines={1}>
          {stat.label}
        </AppText>
        <Amount value={stat.value} variant="caption-strong" tone="on-primary" numberOfLines={1} />
      </View>
    )),
    ...(status
      ? [
          <View
            key="status"
            className={`min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-lg p-3 ${statusTones[status.tone ?? 'neutral'].card}`}>
            {status.icon ? (
              <Icon
                name={status.icon}
                size={16}
                color={statusTones[status.tone ?? 'neutral'].icon}
              />
            ) : null}
            <AppText
              variant="body-strong"
              tone={statusTones[status.tone ?? 'neutral'].text}
              numberOfLines={1}>
              {status.label}
            </AppText>
          </View>,
        ]
      : []),
  ];

  return (
    <View className="gap-4 rounded-2xl bg-ink p-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 shrink flex-row items-center gap-2">
          <AppText variant="label" tone="on-ink-muted" numberOfLines={1} className="min-w-0 shrink">
            {eyebrow}
          </AppText>
          {badge ? (
            <View className="min-h-6 shrink-0 flex-row items-center gap-1 rounded-lg bg-ink-raised px-2">
              <Icon name="calendar" size={12} color="on-ink-muted" />
              <AppText variant="label" tone="on-primary">
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
        <DeltaChip percentage={percentage} level={level} surface="dark" />
      </View>
      <View className="gap-1">
        <Amount
          value={amount}
          variant="hero"
          tone="on-primary"
          role="heading"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        />
        {/* The accent pill is a fill with dark text on it: the gold fails contrast under light text. */}
        <View className="min-h-6 self-start justify-center rounded-lg bg-accent px-2">
          <AppText variant="label" tone="ink">
            {`Target ${formatMoney(target)}`}
          </AppText>
        </View>
      </View>
      {series.length > 1 ? <Sparkline values={series} color={color} height={64} /> : null}
      <Meter dark percentage={percentage} fill={color} />
      {rows(tiles).map((row, index) => (
        <View key={index} className="flex-row gap-3">
          {row}
        </View>
      ))}
    </View>
  );
}
