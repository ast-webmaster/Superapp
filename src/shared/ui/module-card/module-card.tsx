import { clsx } from 'clsx';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Badge, type BadgeProps } from '../badge/badge';
import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

interface ModuleCardBaseProps {
  className?: string;
}

interface ModuleCardLoadingProps extends ModuleCardBaseProps {
  loading: true;
}

interface ModuleCardContentProps extends ModuleCardBaseProps {
  loading?: false;
  title: string;
  department?: string;
  /** Tile icon, shown on `primary`. Ignored when `imageSrc` is set. */
  icon?: IconName;
  imageSrc?: string | number;
  badges?: readonly [BadgeProps] | readonly [BadgeProps, BadgeProps];
  /** For example "Updated 5m ago". */
  meta?: string;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  onOpen?: () => void;
}

export type ModuleCardProps = ModuleCardLoadingProps | ModuleCardContentProps;

const cardStyle = 'flex-row gap-4 rounded-xl bg-surface p-3 shadow-card';

export function ModuleCard(props: ModuleCardProps) {
  if (props.loading) return <ModuleCardSkeleton className={props.className} />;

  const {
    title,
    department,
    icon = 'box',
    imageSrc,
    badges,
    meta,
    favorite = false,
    onToggleFavorite,
    onOpen,
    className,
  } = props;

  return (
    <View className={clsx(cardStyle, className)}>
      <View className="size-tile items-center justify-center overflow-hidden rounded-lg bg-primary">
        {imageSrc ? (
          <Image source={imageSrc} contentFit="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <Icon name={icon} size={40} color="on-primary" />
        )}
        {onToggleFavorite ? (
          <Pressable
            role="button"
            aria-label={favorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            aria-pressed={favorite}
            accessibilityState={{ selected: favorite }}
            onPress={onToggleFavorite}
            className={clsx(
              'absolute top-0 right-0 size-touch items-center justify-center rounded-pill',
              focusRing,
            )}>
            <View className="size-8 items-center justify-center rounded-pill bg-surface">
              <Icon name="heart" size={16} color={favorite ? 'danger' : 'ink'} filled={favorite} />
            </View>
          </Pressable>
        ) : null}
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <AppText variant="module-title" numberOfLines={2}>
          {title}
        </AppText>
        {department ? (
          <View className="flex-row items-center gap-1">
            <Icon name="building" size={16} color="ink-muted" />
            <AppText variant="caption" tone="muted" className="min-w-0 flex-1">
              {department}
            </AppText>
          </View>
        ) : null}
        {badges ? (
          <View className="flex-row flex-wrap gap-1">
            {badges.map((badge) => (
              <Badge key={badge.label} {...badge} />
            ))}
          </View>
        ) : null}
        <View className="mt-auto flex-row items-center justify-between gap-1">
          {meta ? (
            <AppText variant="caption" tone="muted" className="min-w-0 flex-1">
              {meta}
            </AppText>
          ) : (
            <View />
          )}
          {onOpen ? (
            <Pressable
              role="button"
              aria-label={`Open ${title}`}
              onPress={onOpen}
              className={clsx(
                'min-h-touch -my-2 flex-row items-center gap-1 rounded-pill',
                focusRing,
              )}>
              <AppText variant="body-strong" tone="primary">
                Open
              </AppText>
              <Icon name="arrow-right" size={16} color="primary" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ModuleCardSkeleton({ className }: { className?: string }) {
  return (
    <View
      accessible
      role="progressbar"
      aria-label="Loading module"
      aria-busy
      className={clsx(cardStyle, className)}>
      <View className="size-tile rounded-lg bg-surface-gray" />
      <View className="min-w-0 flex-1 gap-3 py-1">
        <View className="h-5 w-3/4 rounded-sm bg-surface-gray" />
        <View className="h-4 w-1/2 rounded-sm bg-surface-gray" />
        <View className="h-8 w-2/3 rounded-pill bg-surface-gray" />
      </View>
    </View>
  );
}
