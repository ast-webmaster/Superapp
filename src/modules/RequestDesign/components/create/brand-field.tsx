import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Sheet, TextField, OptionRow } from '@/shared/ui';

import type { Brand } from '../../types';
import { PickerField } from './picker-field';

export interface BrandFieldProps {
  /** Every brand the user may choose, from `GET /options`. */
  brands: readonly Brand[];
  /** The chosen `category_code`s. */
  value: readonly string[];
  onChange: (codes: string[]) => void;
  error?: string;
}

/** One or more brands, chosen from a searchable sheet. The sheet stays open while the user ticks. */
export function BrandField({ brands, value, onChange, error }: BrandFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? brands.filter((brand) => brand.category_name.toLowerCase().includes(needle))
    : brands;
  const names = brands
    .filter((brand) => value.includes(brand.category_code))
    .map((brand) => brand.category_name);

  const toggle = (code: string) =>
    onChange(value.includes(code) ? value.filter((item) => item !== code) : [...value, code]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <PickerField
        label="Brands"
        required
        value={names.length > 0 ? names.join(', ') : null}
        placeholder="Choose the brands"
        onPress={() => setOpen(true)}
        error={error}
      />
      <Sheet
        visible={open}
        fullHeight
        title="Choose brands"
        onClose={close}
        footer={
          <Button block onPress={close}>
            {value.length > 0 ? `Done (${value.length})` : 'Done'}
          </Button>
        }>
        <TextField
          icon="search"
          variant="search"
          placeholder="Search"
          aria-label="Search brands"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {shown.length === 0 ? (
          <AppText tone="muted">Nothing matches your search.</AppText>
        ) : (
          <View className="gap-2 pb-2">
            {shown.map((brand) => {
              const selected = value.includes(brand.category_code);
              return (
                <OptionRow
                  key={brand.category_code}
                  role="checkbox"
                  aria-label={brand.category_name}
                  label={brand.category_name}
                  selected={selected}
                  onPress={() => toggle(brand.category_code)}
                />
              );
            })}
          </View>
        )}
      </Sheet>
    </>
  );
}
