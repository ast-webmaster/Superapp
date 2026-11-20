import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/shared/ui';

/**
 * A card with a title and a one-line note above a chart: white by default, or the `accent` fill
 * with `ink` text (the gold fails contrast under any lighter text) to make one card stand out.
 */
export function ReportCard({
  title,
  note,
  tone = 'default',
  children,
}: {
  title: string;
  note?: string;
  tone?: 'default' | 'accent';
  children: ReactNode;
}) {
  const accent = tone === 'accent';

  return (
    <View
      className={clsx(
        'gap-4 rounded-xl p-4',
        accent ? 'bg-accent' : 'border border-border bg-surface',
      )}>
      <View className="gap-1">
        <AppText variant="module-title" role="heading">
          {title}
        </AppText>
        {note ? (
          <AppText variant="caption" tone={accent ? 'ink' : 'muted'}>
            {note}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}
