import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, focusRing, Icon, Sheet, TextField } from '@/shared/ui';

import { PickerField } from './picker-field';

export interface MultiPickOption {
  value: string;
  label: string;
}

export interface MultiPickFieldProps {
  label: string;
  placeholder: string;
  options: readonly MultiPickOption[];
  value: readonly string[];
  onChange: (values: string[]) => void;
  error?: string;
}

/** One or more choices from a searchable sheet. The sheet stays open while the user ticks. */
export function MultiPickField({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
}: MultiPickFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;
  const names = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  const toggle = (item: string) =>
    onChange(
      value.includes(item) ? value.filter((existing) => existing !== item) : [...value, item],
    );

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <PickerField
        label={label}
        required
        value={names.length > 0 ? names.join(', ') : null}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        error={error}
      />
      <Sheet
        visible={open}
        fullHeight
        title={`Choose ${label.toLowerCase()}`}
        onClose={close}
        footer={
          <Button block onPress={close}>
            {value.length > 0 ? `Done (${value.length})` : 'Done'}
          </Button>
        }>
        {options.length > 8 ? (
          <TextField
            icon="search"
            placeholder="Search"
            aria-label={`Search ${label.toLowerCase()}`}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : null}
        {shown.length === 0 ? (
          <AppText tone="muted">Nothing matches your search.</AppText>
        ) : (
          <View className="gap-1 pb-2">
            {shown.map((option) => {
              const selected = value.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={option.label}
                  onPress={() => toggle(option.value)}
                  className={clsx(
                    'min-h-control flex-row items-center gap-3 rounded-md px-3 py-2 active:bg-surface-gray',
                    selected && 'bg-primary-soft',
                    focusRing,
                  )}>
                  <AppText variant="body-strong" className="min-w-0 flex-1">
                    {option.label}
                  </AppText>
                  {selected ? <Icon name="check" color="primary" /> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </Sheet>
    </>
  );
}
