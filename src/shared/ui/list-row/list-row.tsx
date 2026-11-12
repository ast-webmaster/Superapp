import { clsx } from 'clsx';
import { Children, Fragment, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface ListRowProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  icon?: IconName;
  value?: string;
  /** An exit or destructive action, such as Sign out: danger color, no chevron. */
  destructive?: boolean;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

const rowStyle = 'min-h-control flex-row items-center gap-3 py-3';

export function ListRow({
  label,
  icon,
  value,
  destructive = false,
  onPress,
  className,
  ...props
}: ListRowProps) {
  const content = (
    <>
      {icon ? <Icon name={icon} color={destructive ? 'danger' : 'ink'} /> : null}
      <AppText variant="body-strong" tone={destructive ? 'danger' : 'ink'} className="min-w-0 flex-1">
        {label}
      </AppText>
      {value ? <AppText tone="muted">{value}</AppText> : null}
      {onPress && !destructive ? <Icon name="chevron-right" color="ink-muted" /> : null}
    </>
  );

  if (!onPress) return <View className={clsx(rowStyle, className)}>{content}</View>;

  return (
    <Pressable
      role="button"
      onPress={onPress}
      className={clsx(rowStyle, 'rounded-md active:bg-surface-gray', focusRing, className)}
      {...props}>
      {content}
    </Pressable>
  );
}

export interface ListGroupProps {
  children: ReactNode;
  className?: string;
}

/** A card of rows with a hairline between them and none after the last. */
export function ListGroup({ children, className }: ListGroupProps) {
  const rows = Children.toArray(children);

  return (
    <View className={clsx('rounded-xl bg-surface px-4 border border-border', className)}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {row}
          {index < rows.length - 1 ? (
            <View role="separator" testID="list-divider" className="h-px bg-border" />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}
