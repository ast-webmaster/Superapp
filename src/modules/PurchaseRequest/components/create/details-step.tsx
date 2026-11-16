import { View } from 'react-native';

import { TextField } from '@/shared/ui';

import type { Errors } from '../../create/draft';
import { useOfficeOptions, useVendorOptions } from '../../hooks/use-lookups';
import type {
  OfficeOption,
  PaymentMethod,
  PurchaseRequestDraft,
  RequestCategory,
  VendorOption,
} from '../../types';
import { ChoiceField } from './choice-field';
import { LookupField } from './lookup-field';

const CATEGORIES: readonly { value: RequestCategory; label: string }[] = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'NON STOCK', label: 'Non stock' },
];

const PAYMENT_METHODS: readonly { value: PaymentMethod; label: string }[] = [
  { value: 'COD', label: 'COD' },
  { value: 'CBD', label: 'CBD' },
  { value: 'BANK TRANSFER', label: 'Bank transfer' },
  { value: 'CREDIT CARD', label: 'Credit card' },
  { value: 'CN', label: 'CN' },
  { value: 'OTHERS', label: 'Others' },
];

export interface DetailsStepProps {
  draft: PurchaseRequestDraft;
  onChange: (patch: Partial<PurchaseRequestDraft>) => void;
  /** Field errors to show. Empty until the user tries to continue. */
  errors: Errors;
}

export function DetailsStep({ draft, onChange, errors }: DetailsStepProps) {
  return (
    <View className="gap-4">
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
      <ChoiceField
        label="Category"
        required
        options={CATEGORIES}
        value={draft.category}
        onChange={(category) => onChange({ category })}
        error={errors.category}
      />
      <LookupField<OfficeOption>
        label="Delivery address"
        required
        placeholder="Choose an office"
        sheetTitle="Choose delivery address"
        value={draft.office}
        onChange={(office) => onChange({ office })}
        useOptions={useOfficeOptions}
        getKey={(office) => String(office.id)}
        getTitle={(office) => office.office_name ?? `Office ${office.id}`}
        error={errors.office}
      />
      <ChoiceField
        label="Payment method"
        required
        options={PAYMENT_METHODS}
        value={draft.paymentMethod}
        onChange={(paymentMethod) => onChange({ paymentMethod })}
        error={errors.paymentMethod}
      />
      <LookupField<VendorOption>
        label="Vendor"
        placeholder="Find a vendor (optional)"
        sheetTitle="Choose vendor"
        value={draft.vendor}
        onChange={(vendor) => onChange({ vendor })}
        useOptions={useVendorOptions}
        getKey={(vendor) => String(vendor.id)}
        getTitle={(vendor) => vendor.company_name ?? `Vendor ${vendor.id}`}
        getCaption={(vendor) => vendor.vendor_code}
        clearable
        onClear={() => onChange({ vendor: null })}
      />
      <TextField
        label="Vendor reference"
        value={draft.vendorReference}
        onChangeText={(vendorReference) => onChange({ vendorReference })}
        multiline
        textAlignVertical="top"
        className="min-h-20"
      />
      <TextField
        label="Reference"
        value={draft.reference}
        onChangeText={(reference) => onChange({ reference })}
        maxLength={191}
      />
    </View>
  );
}
