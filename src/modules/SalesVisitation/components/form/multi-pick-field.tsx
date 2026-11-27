import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Sheet, TextField, OptionRow } from '@/shared/ui';

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
            variant="search"
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
          <View className="gap-2 pb-2">
            {shown.map((option) => {
              const selected = value.includes(option.value);
              return (
                <OptionRow
                  key={option.value}
                  role="checkbox"
                  aria-label={option.label}
                  label={option.label}
                  selected={selected}
                  onPress={() => toggle(option.value)}
                />
              );
            })}
          </View>
        )}
      </Sheet>
    </>
  );
}
