import type { UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { Alert, AppText, Button, focusRing, Loading, Sheet, TextField } from '@/shared/ui';

import { LOOKUP_LIMIT, LOOKUP_MIN_CHARS, lookupSearchTerm } from '../../create/lookup-search';
import { PickerField } from './picker-field';

export interface LookupFieldProps<T> {
  label: string;
  required?: boolean;
  placeholder: string;
  /** Title of the sheet, for example "Choose customer". */
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
  disabled?: boolean;
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
  disabled,
}: LookupFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Debounced, so typing fires one request after the pause, not one per key. React Query
  // cancels the request for older text (`signal`), so a slow answer never replaces a newer one.
  const search = useDebouncedValue(lookupSearchTerm(query));
  const typing = lookupSearchTerm(query) !== search;
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
        disabled={disabled}
      />
      <Sheet visible={open} fullHeight title={sheetTitle} onClose={close}>
        <TextField
          icon="search"
          placeholder="Search"
          aria-label={`Search ${label.toLowerCase()}`}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          help={
            query.trim().length > 0 && query.trim().length < LOOKUP_MIN_CHARS
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
          <View className="gap-1 pb-2">
            {data.map((option) => {
              const caption = getCaption?.(option);
              return (
                <Pressable
                  key={getKey(option)}
                  role="button"
                  className={`min-h-control justify-center rounded-md px-3 py-2 active:bg-surface-gray ${focusRing}`}
                  onPress={() => {
                    onChange(option);
                    close();
                  }}>
                  <AppText variant="body-strong">{getTitle(option)}</AppText>
                  {caption ? (
                    <AppText variant="caption" tone="muted">
                      {caption}
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
            {data.length >= LOOKUP_LIMIT ? (
              <AppText variant="caption" tone="muted" className="px-3 pt-2">
                {`Showing the first ${LOOKUP_LIMIT}. Type to narrow the list.`}
              </AppText>
            ) : null}
          </View>
        )}
      </Sheet>
    </>
  );
}
