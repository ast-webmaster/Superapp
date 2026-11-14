import { AppText } from '@/shared/ui';

/** "Today · 14:42" above the first message of each day. */
export function DayDivider({ label }: { label: string }) {
  return (
    <AppText variant="caption" tone="muted" className="self-center">
      {label}
    </AppText>
  );
}
