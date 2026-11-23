import { View } from 'react-native';

import { AppText } from '@/shared/ui';

/** A heading with an optional one-line note under it, for a block inside a view. */
export function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <View className="gap-1 pt-2">
      <AppText variant="title" role="heading">
        {title}
      </AppText>
      {note ? (
        <AppText variant="caption" tone="muted">
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

/** A label over a figure, for the small facts inside a card. */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 gap-1">
      <AppText variant="label" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="body-strong" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
    </View>
  );
}
