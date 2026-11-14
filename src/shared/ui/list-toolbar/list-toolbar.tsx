import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { focusRing } from '../focus';
import { IconButton } from '../icon-button/icon-button';
import type { IconName } from '../icon/icon';
import { ListGroup, ListRow } from '../list-row/list-row';
import { Sheet } from '../sheet/sheet';
import { TextField } from '../text-field/text-field';
import { AppText } from '../text/text';

export interface ListToolbarAction {
  key: string;
  label: string;
  icon?: IconName;
  onPress: () => void;
}

export interface ListToolbarProps {
  /**
   * The search field, shown while `open`. The button that opens it lives in the top app bar
   * (`headerRight`), so the module owns `open`. The module decides what the text matches.
   */
  search?: {
    open: boolean;
    onClose: () => void;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Shows the filter button. The module opens its own `Sheet` from this. */
  onFilter?: () => void;
  /** Lit while any filter is applied. */
  filterActive?: boolean;
  /** Shows the actions button, a menu of things like export and import. Leave empty to hide it. */
  actions?: readonly ListToolbarAction[];
  /** A module's own quick filters, such as a status `ChipGroup`. They scroll beside the buttons. */
  children?: ReactNode;
  className?: string;
}

/**
 * The top of a module's index screen: filter and actions buttons, then the module's own chips on
 * the same row; the search field replaces the row while open. Each button appears only when its
 * prop is passed, so a module shows just what it supports. Create is not here: use `Fab`.
 */
export function ListToolbar({
  search,
  onFilter,
  filterActive = false,
  actions = [],
  children,
  className,
}: ListToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (search?.open) {
    return (
      <View className={clsx('flex-row items-center gap-3 px-5', className)}>
        <TextField
          autoFocus
          icon="search"
          placeholder={search.placeholder ?? 'Search'}
          value={search.value}
          onChangeText={search.onChange}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={search.onClose}
          className="min-w-0 flex-1"
        />
        <Pressable
          role="button"
          aria-label="Cancel search"
          className={clsx('min-h-touch justify-center rounded-pill px-1', focusRing)}
          onPress={() => {
            search.onChange('');
            search.onClose();
          }}>
          <AppText variant="body-strong">Cancel</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View className={clsx('flex-row items-center gap-3 pl-5', className)}>
      {onFilter ? (
        <IconButton icon="sliders" label="Filter" active={filterActive} onPress={onFilter} />
      ) : null}
      {actions.length > 0 ? (
        <>
          <IconButton icon="more" label="Actions" onPress={() => setMenuOpen(true)} />
          <Sheet visible={menuOpen} title="Actions" onClose={() => setMenuOpen(false)}>
            <ListGroup>
              {actions.map((action) => (
                <ListRow
                  key={action.key}
                  label={action.label}
                  icon={action.icon}
                  onPress={() => {
                    setMenuOpen(false);
                    action.onPress();
                  }}
                />
              ))}
            </ListGroup>
          </Sheet>
        </>
      ) : null}
      {children ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="min-w-0 flex-1"
          contentContainerClassName="items-center pr-5">
          {children}
        </ScrollView>
      ) : null}
    </View>
  );
}
