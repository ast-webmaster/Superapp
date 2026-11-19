import { View } from 'react-native';

import { AppText, FieldLabel, MultiChipGroup, TextField } from '@/shared/ui';

import { sanitizeInteger } from '../../create/amount';
import type { Errors } from '../../create/draft';
import type { BrandOption, OnDutyRequestDraft, TripType } from '../../types';
import { tripTypeLabels } from '../status';
import { ChoiceField } from './choice-field';
import { DocumentField } from './document-field';

const TYPES = (Object.keys(tripTypeLabels) as TripType[]).map((value) => ({
  value,
  label: tripTypeLabels[value],
}));

export interface DetailsStepProps {
  draft: OnDutyRequestDraft;
  brands: BrandOption[];
  /** A resubmit may leave the letter out: the one on the server stays. */
  letterRequired: boolean;
  onChange: (patch: Partial<OnDutyRequestDraft>) => void;
  /** Field errors to show. Empty until the user tries to continue. */
  errors: Errors;
}

export function DetailsStep({ draft, brands, letterRequired, onChange, errors }: DetailsStepProps) {
  const brandName = (code: string) =>
    brands.find((brand) => brand.category_code === code)?.category_name ?? code;

  return (
    <View className="gap-4">
      <ChoiceField
        label="Trip type"
        required
        options={TYPES}
        value={draft.type}
        // The destinations are cities or countries by type, so a new type starts them over.
        onChange={(type) => onChange(type === draft.type ? {} : { type, destinations: [] })}
        error={errors.type}
      />
      <AppText variant="caption" tone="muted">
        {draft.destinations.length > 0
          ? 'Changing the type removes the destinations you added.'
          : 'Domestic trips go to cities, overseas trips to countries. The type also sets your daily allowance.'}
      </AppText>
      <TextField
        label="Purpose"
        required
        value={draft.purpose}
        onChangeText={(purpose) => onChange({ purpose })}
        error={errors.purpose}
        multiline
        textAlignVertical="top"
        className="min-h-24"
      />
      <TextField
        label="Remarks"
        required
        value={draft.remarks}
        onChangeText={(remarks) => onChange({ remarks })}
        error={errors.remarks}
        multiline
        textAlignVertical="top"
        className="min-h-20"
      />
      <View className="gap-2">
        <FieldLabel required>Brands</FieldLabel>
        <MultiChipGroup
          label="Brands"
          options={brands.map((brand) => ({
            value: brand.category_code,
            label: brand.category_name ?? brand.category_code,
          }))}
          values={draft.brands}
          onChange={(selected) => onChange({ brands: selected })}
        />
        {errors.brands ? (
          <AppText variant="caption" tone="danger" aria-live="polite">
            {errors.brands}
          </AppText>
        ) : null}
      </View>
      {draft.brands.length > 1 ? (
        <View className="gap-2">
          <FieldLabel>Share the cost between brands</FieldLabel>
          <AppText variant="caption" tone="muted">
            Optional. If you fill it in, the percentages must add up to 100. The product managers of
            the other brands are invited by email.
          </AppText>
          {draft.brands.map((code) => (
            <TextField
              key={code}
              label={`${brandName(code)} (%)`}
              keyboardType="number-pad"
              maxLength={3}
              value={draft.sharing[code] ?? ''}
              onChangeText={(text) =>
                onChange({ sharing: { ...draft.sharing, [code]: sanitizeInteger(text) } })
              }
            />
          ))}
          {errors.sharing ? (
            <AppText variant="caption" tone="danger" aria-live="polite">
              {errors.sharing}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <DocumentField
        label="Letter of assignment"
        required={letterRequired}
        value={draft.letter}
        onChange={(letter) => onChange({ letter })}
        error={errors.letter}
        help={
          letterRequired
            ? undefined
            : 'The letter you sent before stays unless you choose a new file. PDF, image, Word or Excel, up to 10 MB.'
        }
      />
    </View>
  );
}
