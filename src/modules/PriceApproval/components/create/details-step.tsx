import { View } from 'react-native';

import { TextField } from '@/shared/ui';

import type { Errors } from '../../create/draft';
import { useCustomerOptions } from '../../hooks/use-lookups';
import type {
  CustomerOption,
  PaymentType,
  PoSc,
  PriceApprovalDraft,
  PriceCategory,
  Shipment,
} from '../../types';
import { ChoiceField } from './choice-field';
import { DateField } from './date-field';
import { LookupField } from './lookup-field';

const PO_SC: readonly { value: PoSc; label: string }[] = [
  { value: 'PO', label: 'PO' },
  { value: 'SC', label: 'SC' },
];
const PAYMENT_TYPES: readonly { value: PaymentType; label: string }[] = [
  { value: 'TOP', label: 'TOP' },
  { value: 'CASH', label: 'Cash' },
];
const CATEGORIES: readonly { value: PriceCategory; label: string }[] = [
  { value: 'PKP', label: 'PKP' },
  { value: 'NON-PKP', label: 'Non-PKP' },
];
const SHIPMENTS: readonly { value: Shipment; label: string }[] = [
  { value: 'DS', label: 'DS' },
  { value: 'NON-DS', label: 'Non-DS' },
];

export interface DetailsStepProps {
  draft: PriceApprovalDraft;
  onChange: (patch: Partial<PriceApprovalDraft>) => void;
  /** Field errors to show. Empty until the user tries to continue. */
  errors: Errors;
}

export function DetailsStep({ draft, onChange, errors }: DetailsStepProps) {
  return (
    <>
      <View className="gap-4">
        <ChoiceField
          label="PO or SC"
          required
          options={PO_SC}
          value={draft.poSc}
          onChange={(poSc) => onChange({ poSc })}
          error={errors.poSc}
        />
        {draft.poSc === 'PO' ? (
          <DateField
            label="Order date"
            required
            value={draft.orderDate}
            onChange={(orderDate) => onChange({ orderDate })}
            error={errors.orderDate}
          />
        ) : null}
        <LookupField<CustomerOption>
          label="Customer"
          required
          placeholder="Find a customer"
          sheetTitle="Choose customer"
          value={draft.customer}
          onChange={(customer) => onChange({ customer })}
          useOptions={useCustomerOptions}
          getKey={(customer) => customer.customer_id}
          getTitle={(customer) => customer.customer_name}
          getCaption={(customer) => customer.customer_id}
          error={errors.customer}
        />
        <ChoiceField
          label="Payment type"
          required
          options={PAYMENT_TYPES}
          value={draft.paymentType}
          onChange={(paymentType) => onChange({ paymentType })}
          error={errors.paymentType}
        />
        <ChoiceField
          label="Category"
          required
          options={CATEGORIES}
          value={draft.category}
          onChange={(category) => onChange({ category })}
          error={errors.category}
        />
        <TextField
          label="Remarks"
          value={draft.remarks}
          onChangeText={(remarks) => onChange({ remarks })}
          multiline
          textAlignVertical="top"
          className="min-h-24"
        />
      </View>

      <View className="gap-4">
        <ChoiceField
          label="Shipment"
          required
          options={SHIPMENTS}
          value={draft.shipment}
          onChange={(shipment) => onChange({ shipment })}
          error={errors.shipment}
        />
        <TextField
          label="Shipping note"
          required
          value={draft.shippingNote}
          onChangeText={(shippingNote) => onChange({ shippingNote })}
          error={errors.shippingNote}
          multiline
          textAlignVertical="top"
          className="min-h-24"
        />
      </View>
    </>
  );
}
