import type { UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { Alert, AppText, Button, Loading, Sheet, TextField, OptionRow } from '@/shared/ui';

import { LOOKUP_LIMIT, LOOKUP_MIN_CHARS, lookupSearchTerm } from '../../create/lookup-search';
import { PickerField } from './picker-field';

export interface LookupFieldProps<T> {
  label: string;
  required?: boolean;
  placeholder: string;
  /** Title of the sheet, for example "Choose item". */
  sheetTitle: string;
  value: T | null;
  onChange: (value: T) => void;
  /** The query behind the sheet. `enabled` is false until the sheet opens. */
  useOptions: (search: string, enabled: boolean) => UseQueryResult<T[]>;
  getKey: (option: T) => string;
  getTitle: (option: T) => string;
  getCaption?: (option: T) => string | null;
  help?: string;
  error?: string;
  /** The list is short and not searched on the server, so only the text field narrows it. */
  localSearch?: boolean;
}

/** A field that opens a searchable sheet. The server does the searching: it holds the full list. */
export function LookupField<T>({
  label,
  required,
  placeholder,
  sheetTitle,
  value,
  onChange,
  useOptions,
  getKey,
  getTitle,
  getCaption,
  help,
  error,
  localSearch = false,
}: LookupFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Debounced, so typing fires one request after the pause, not one per key. React Query
  // cancels the request for older text (`signal`), so a slow answer never replaces a newer one.
  const search = useDebouncedValue(localSearch ? query.trim() : lookupSearchTerm(query));
  const typing = (localSearch ? query.trim() : lookupSearchTerm(query)) !== search;
  const { data, error: loadError, refetch } = useOptions(search, open);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <PickerField
        label={label}
        required={required}
        value={value ? getTitle(value) : null}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        help={help}
        error={error}
      />
      <Sheet visible={open} fullHeight title={sheetTitle} onClose={close}>
        <TextField
          icon="search"
          variant="search"
          placeholder="Search"
          aria-label={`Search ${label.toLowerCase()}`}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          help={
            !localSearch && query.trim().length > 0 && query.trim().length < LOOKUP_MIN_CHARS
              ? `Type at least ${LOOKUP_MIN_CHARS} characters to search.`
              : undefined
          }
        />
        {typing ? (
          <Loading label="Searching" />
        ) : loadError ? (
          <>
            <Alert tone="danger" message={toAppError(loadError).message} />
            <Button variant="soft" onPress={() => refetch()}>
              Try again
            </Button>
          </>
        ) : data === undefined ? (
          <Loading label="Searching" />
        ) : data.length === 0 ? (
          <AppText tone="muted">
            {search ? 'Nothing matches your search.' : 'Nothing to choose.'}
          </AppText>
        ) : (
          <View className="gap-2 pb-2">
            {data.map((option) => {
              const caption = getCaption?.(option);
              return (
                <OptionRow
                  key={getKey(option)}
                  label={getTitle(option)}
                  caption={caption}
                  selected={value !== null && getKey(value) === getKey(option)}
                  onPress={() => {
                    onChange(option);
                    close();
                  }}
                />
              );
            })}
            {!localSearch && data.length >= LOOKUP_LIMIT ? (
              <AppText variant="caption" tone="muted" className="px-5 pt-2">
                {`Showing the first ${LOOKUP_LIMIT}. Type to narrow the list.`}
              </AppText>
            ) : null}
          </View>
        )}
      </Sheet>
    </>
  );
}
