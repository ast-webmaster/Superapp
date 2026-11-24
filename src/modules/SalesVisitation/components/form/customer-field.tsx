import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { AppText, focusRing, Loading, Sheet, TextField, Toggle } from '@/shared/ui';

import { CUSTOMER_MIN_CHARS, useCustomerSearch } from '../../hooks/use-lookups';
import { MAX_CUSTOMER_NAME } from '../../create/draft';
import type { CustomerChoice } from '../../types';
import { PickerField } from './picker-field';

export interface CustomerFieldProps {
  unregistered: boolean;
  customer: CustomerChoice | null;
  customerName: string;
  onChange: (
    patch: Partial<{
      unregistered: boolean;
      customer: CustomerChoice | null;
      customerName: string;
    }>,
  ) => void;
  error?: string;
}

/**
 * The company visited: a registered one chosen from a search, or a free-text name for a company
 * that is not in the system yet (then no saved locations are offered, the server has none).
 */
export function CustomerField({
  unregistered,
  customer,
  customerName,
  onChange,
  error,
}: CustomerFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const search = useCustomerSearch(query, open);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const term = query.trim();
  const typedEnough = term.length >= CUSTOMER_MIN_CHARS;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="caption-strong" className="min-w-0 flex-1">
          Customer is not registered
        </AppText>
        <Toggle
          label="Customer is not registered"
          value={unregistered}
          onValueChange={(value) => onChange({ unregistered: value })}
        />
      </View>
      {unregistered ? (
        <TextField
          label="Customer name"
          required
          maxLength={MAX_CUSTOMER_NAME}
          value={customerName}
          onChangeText={(value) => onChange({ customerName: value })}
          error={error}
        />
      ) : (
        <>
          <PickerField
            label="Customer"
            required
            value={customer ? customer.customer_name : null}
            placeholder="Search a customer"
            onPress={() => setOpen(true)}
            error={error}
          />
          <Sheet visible={open} fullHeight title="Choose a customer" onClose={close}>
            <TextField
              icon="search"
              placeholder="Customer name or id"
              aria-label="Search customers"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {!typedEnough ? (
              <AppText tone="muted">{`Type at least ${CUSTOMER_MIN_CHARS} characters.`}</AppText>
            ) : search.isPending && search.fetchStatus !== 'idle' ? (
              <Loading label="Searching customers" />
            ) : search.error ? (
              <AppText tone="danger">{toAppError(search.error).message}</AppText>
            ) : search.data && search.data.length > 0 ? (
              <View className="gap-1 pb-2">
                {search.data.map((item) => (
                  <Pressable
                    key={item.customer_id}
                    role="button"
                    aria-label={item.customer_name}
                    onPress={() => {
                      onChange({ customer: item });
                      close();
                    }}
                    className={clsx(
                      'min-h-control justify-center rounded-md px-3 py-2 active:bg-surface-gray',
                      customer?.customer_id === item.customer_id && 'bg-primary-soft',
                      focusRing,
                    )}>
                    <AppText variant="body-strong" numberOfLines={2}>
                      {item.customer_name}
                    </AppText>
                    <AppText variant="label" tone="muted">
                      {item.customer_id}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : (
              <AppText tone="muted">
                No customer matches. If it is not registered yet, close this and switch on the
                unregistered option to type its name.
              </AppText>
            )}
          </Sheet>
        </>
      )}
    </View>
  );
}
