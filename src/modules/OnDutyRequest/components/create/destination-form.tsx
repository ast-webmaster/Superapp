import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActionBar, AppText, Button } from '@/shared/ui';

import { validateDestination } from '../../create/draft';
import { useDestinationOptions } from '../../hooks/use-lookups';
import type { DraftDestination, TripType } from '../../types';
import { DateRangeField } from './date-range-field';
import { LookupField } from './lookup-field';

export interface DestinationFormProps {
  /** Heading above the fields, such as "New destination". */
  title: string;
  type: TripType;
  initial: DraftDestination;
  /** The other stops, to catch days that overlap. */
  others: DraftDestination[];
  onSave: (row: DraftDestination) => void;
  onCancel: () => void;
}

/** One stop, edited on its own copy: nothing reaches the draft until the user saves it. */
export function DestinationForm({
  title,
  type,
  initial,
  others,
  onSave,
  onCancel,
}: DestinationFormProps) {
  const [row, setRow] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateDestination(row, others) : {};
  // The picker takes a hook; this one fixes the trip type, so the picker lists cities or countries.
  const useOptions = (search: string, enabled: boolean) =>
    useDestinationOptions(type, search, enabled);

  const save = () => {
    if (Object.keys(validateDestination(row, others)).length > 0) {
      setAttempted(true);
      return;
    }
    onSave(row);
  };

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <AppText variant="title" role="heading">
          {title}
        </AppText>
        <View className="gap-4">
          <LookupField<string>
            label={type === 'DOMESTIC' ? 'City' : 'Country'}
            required
            placeholder={type === 'DOMESTIC' ? 'Find a city' : 'Find a country'}
            sheetTitle={type === 'DOMESTIC' ? 'Choose city' : 'Choose country'}
            value={row.destination}
            onChange={(destination) => setRow((current) => ({ ...current, destination }))}
            useOptions={useOptions}
            getKey={(name) => name}
            getTitle={(name) => name}
            error={errors.destination}
          />
          <DateRangeField
            label="Days"
            required
            start={row.startDate}
            end={row.endDate}
            onChange={({ start, end }) =>
              setRow((current) => ({ ...current, startDate: start, endDate: end }))
            }
            error={errors.dates}
            help="Pick the first day, then the last. For one day, tap the same day twice."
          />
        </View>
      </ScrollView>
      <ActionBar>
        <View className="flex-row gap-2">
          <Button block variant="secondary" className="flex-1 px-2" onPress={onCancel}>
            Cancel
          </Button>
          <Button block className="flex-2" onPress={save}>
            Save destination
          </Button>
        </View>
      </ActionBar>
    </>
  );
}
