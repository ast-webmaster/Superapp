import { View } from 'react-native';

import { TextField } from '@/shared/ui';

import { MAX_ADDRESS, MAX_NOTE, MAX_PHONE, MAX_PIC, type Errors } from '../../create/draft';
import { useCustomerOptions } from '../../hooks/use-lookups';
import type { CustomerOption, ProductBorrowingDraft } from '../../types';
import { LookupField } from './lookup-field';

export interface DetailsStepProps {
  draft: ProductBorrowingDraft;
  onChange: (patch: Partial<ProductBorrowingDraft>) => void;
  errors: Errors;
}

/** Who borrows, where the products go and who receives them. */
export function DetailsStep({ draft, onChange, errors }: DetailsStepProps) {
  return (
    <View className="gap-4">
      <LookupField<CustomerOption>
        label="Customer"
        required
        placeholder="Find a customer"
        sheetTitle="Choose customer"
        value={draft.customer}
        onChange={(customer) => onChange({ customer })}
        useOptions={useCustomerOptions}
        getKey={(customer) => customer.customer_id}
        getTitle={(customer) => customer.customer_name ?? customer.customer_id}
        getCaption={(customer) => customer.customer_id}
        error={errors.customer}
      />
      <TextField
        label="Delivery address"
        required
        multiline
        maxLength={MAX_ADDRESS}
        value={draft.address}
        onChangeText={(address) => onChange({ address })}
        error={errors.address}
      />
      <TextField
        label="Phone"
        required
        keyboardType="phone-pad"
        maxLength={MAX_PHONE}
        value={draft.phone}
        onChangeText={(phone) => onChange({ phone })}
        error={errors.phone}
      />
      <TextField
        label="Received by"
        required
        maxLength={MAX_PIC}
        value={draft.picReceiver}
        onChangeText={(picReceiver) => onChange({ picReceiver })}
        error={errors.picReceiver}
      />
      <TextField
        label="Note"
        required
        multiline
        maxLength={MAX_NOTE}
        value={draft.note}
        onChangeText={(note) => onChange({ note })}
        error={errors.note}
      />
    </View>
  );
}
