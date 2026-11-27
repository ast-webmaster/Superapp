import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { ColorToken } from '@/shared/theme/tokens';
import { AppText, Icon, type AppTextProps, type BadgeProps } from '@/shared/ui';

import type { AchievementLevel } from '../types';
import { Amount } from './amount';
import { DayBars } from './charts/day-bars';
import { DeltaChip } from './delta-chip';
import type { Bar } from './series';

export type HeroStat = { label: string; value: number };

export interface HeroCardProps {
  /** A quiet line above the eyebrow naming the number, such as "Total sales". */
  heading?: string;
  /** The card's title line, such as "October 2026". */
  eyebrow: string;
  /** A small pill beside the eyebrow, such as "12 days left". */
  badge?: string;
  amount: number;
  target: number;
  /** Share of the target reached. */
  percentage: number;
  level: AchievementLevel;
  /** Recent sales, oldest first. Empty draws none. */
  bars: Bar[];
  /** Small figures under the bars, two to a row. */
  stats: HeroStat[];
  /** The level, as the last tile after the figures: a card in the level's own color. */
  status?: Pick<BadgeProps, 'label' | 'tone' | 'icon'>;
  /** `primary` fills the card with the primary color and turns its text light. */
  tone?: 'default' | 'primary';
}

/** The card's fill, its inner tiles and its two text tones, per `tone`. */
const looks = {
  default: { card: 'bg-surface', fill: 'bg-surface-gray', text: 'ink', quiet: 'muted' },
  primary: { card: 'bg-primary', fill: 'bg-ink-line', text: 'on-primary', quiet: 'on-ink-muted' },
} as const;

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

/** The working days left in the month, from the server: "1 day left", "12 days left". None at 0. */
export function daysLeftBadge(days: number): string | undefined {
  return days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} left` : undefined;
}

/** Two tiles to a row; a last tile on its own takes the full width. */
function rows(tiles: ReactNode[]): ReactNode[][] {
  return Array.from({ length: Math.ceil(tiles.length / 2) }, (_, index) =>
    tiles.slice(index * 2, index * 2 + 2),
  );
}

/**
 * The headline of a report: a card with one big amount, how far it is from the target as an
 * up/down chip, and the recent days as bars.
 */
export function HeroCard({
  heading,
  eyebrow,
  badge,
  amount,
  target,
  percentage,
  level,
  bars,
  stats,
  status,
  tone = 'default',
}: HeroCardProps) {
  const look = looks[tone];
  const tiles = [
    ...stats.map((stat) => (
      <View key={stat.label} className={`min-w-0 flex-1 gap-1 rounded-md p-3 ${look.fill}`}>
        <AppText variant="label" tone={look.quiet} numberOfLines={1}>
          {stat.label}
        </AppText>
        <Amount value={stat.value} variant="caption-strong" tone={look.text} numberOfLines={1} />
      </View>
    )),
    ...(status
      ? [
          <View
            key="status"
            className={`min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-md p-3 ${statusTones[status.tone ?? 'neutral'].card}`}>
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
    <View className={`gap-4 rounded-2xl p-5 shadow-card ${look.card}`}>
      <View className="items-center gap-1">
        {heading ? (
          <AppText variant="label" tone={look.quiet}>
            {heading}
          </AppText>
        ) : null}
        {/* Wraps only when a large font size leaves no room beside the title. */}
        <View className="flex-row flex-wrap items-center justify-center gap-2">
          <AppText variant="title" tone={look.text} numberOfLines={1}>
            {eyebrow}
          </AppText>
          {badge ? (
            <View className={`min-h-6 flex-row items-center gap-1 rounded-pill px-3 ${look.fill}`}>
              <Icon
                name="calendar"
                size={12}
                color={tone === 'primary' ? 'on-ink-muted' : 'ink-muted'}
              />
              <AppText variant="label" tone={look.quiet}>
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      <View className="gap-2">
        <Amount
          value={amount}
          variant="hero"
          role="heading"
          tone={look.text}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          className="text-center"
        />
        <View className="flex-row flex-wrap items-center justify-center gap-2">
          <DeltaChip percentage={percentage} level={level} />
          <View className={`min-h-7 justify-center rounded-lg px-2 ${look.fill}`}>
            <Amount prefix="Target" value={target} variant="label" tone={look.text} />
          </View>
        </View>
      </View>
      {bars.length > 0 ? <DayBars bars={bars} onDark={tone === 'primary'} /> : null}
      {rows(tiles).map((row, index) => (
        <View key={index} className="flex-row gap-3">
          {row}
        </View>
      ))}
    </View>
  );
}
