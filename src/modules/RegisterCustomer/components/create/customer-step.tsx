import { View } from 'react-native';

import { TextField } from '@/shared/ui';

import { usesIdCard, type Errors } from '../../create/draft';
import {
  ADDRESS_TYPES,
  CATEGORIES,
  FORMS_OF_BUSINESS,
  STATUS_OF_BUSINESS,
  TAXATION_STATUS,
} from '../../create/options';
import type { RegisterCustomerDraft } from '../../types';
import { ChoiceField } from './choice-field';

const asOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

export interface CustomerStepProps {
  draft: RegisterCustomerDraft;
  onChange: (patch: Partial<RegisterCustomerDraft>) => void;
  /** Field errors to show. Empty until the user tries to continue. */
  errors: Errors;
}

export function CustomerStep({ draft, onChange, errors }: CustomerStepProps) {
  return (
    <>
      <View className="gap-4">
        <ChoiceField
          label="Category"
          required
          options={asOptions(CATEGORIES)}
          value={draft.category}
          onChange={(category) => onChange({ category })}
          error={errors.category}
        />
        <TextField
          label="Customer name"
          required
          value={draft.customerName}
          onChangeText={(customerName) => onChange({ customerName })}
          maxLength={191}
          error={errors.customerName}
        />
        <TextField
          label="Address"
          required
          value={draft.customerAddress}
          onChangeText={(customerAddress) => onChange({ customerAddress })}
          error={errors.customerAddress}
          multiline
          textAlignVertical="top"
          className="min-h-24"
        />
        <ChoiceField
          label="Shipping address"
          required
          options={ADDRESS_TYPES}
          value={draft.shippingAddressType}
          onChange={(shippingAddressType) => onChange({ shippingAddressType })}
          error={errors.shippingAddressType}
        />
        {draft.shippingAddressType === 'DIFFERENT' ? (
          <TextField
            label="Shipping address details"
            required
            value={draft.shippingAddress}
            onChangeText={(shippingAddress) => onChange({ shippingAddress })}
            error={errors.shippingAddress}
            multiline
            textAlignVertical="top"
            className="min-h-24"
          />
        ) : null}
        <TextField
          label="Phone"
          required
          value={draft.phone}
          onChangeText={(phone) => onChange({ phone })}
          keyboardType="phone-pad"
          maxLength={16}
          error={errors.phone}
        />
        <TextField
          label="Fax"
          value={draft.fax}
          onChangeText={(fax) => onChange({ fax })}
          keyboardType="phone-pad"
          maxLength={20}
        />
        <TextField
          label="Website"
          value={draft.website}
          onChangeText={(website) => onChange({ website })}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={191}
        />
      </View>

      <View className="gap-4">
        <ChoiceField
          label="Business form"
          required
          options={asOptions(FORMS_OF_BUSINESS)}
          value={draft.formsOfBusiness}
          onChange={(formsOfBusiness) => onChange({ formsOfBusiness })}
          error={errors.formsOfBusiness}
        />
        <ChoiceField
          label="Business status"
          options={asOptions(STATUS_OF_BUSINESS)}
          value={draft.statusOfBusiness}
          onChange={(statusOfBusiness) => onChange({ statusOfBusiness })}
        />
        <ChoiceField
          label="Tax status"
          required
          options={TAXATION_STATUS}
          value={draft.taxationStatus}
          onChange={(taxationStatus) => onChange({ taxationStatus })}
          error={errors.taxationStatus}
        />
        {draft.formsOfBusiness ? (
          usesIdCard(draft) ? (
            <TextField
              label="ID card number"
              required
              value={draft.businessIdCardNumber}
              onChangeText={(text) => onChange({ businessIdCardNumber: text.replace(/\D/g, '') })}
              keyboardType="number-pad"
              maxLength={16}
              help="16 digits."
              error={errors.businessIdCardNumber}
            />
          ) : (
            <TextField
              label="Tax ID (NPWP)"
              required
              value={draft.taxIdNumber}
              onChangeText={(taxIdNumber) => onChange({ taxIdNumber })}
              maxLength={191}
              error={errors.taxIdNumber}
            />
          )
        ) : null}
        <TextField
          label="Business ID (NIB)"
          value={draft.businessIdNumber}
          onChangeText={(businessIdNumber) => onChange({ businessIdNumber })}
          maxLength={191}
        />
        <TextField
          label="Date established"
          value={draft.dateOfIncorporation}
          onChangeText={(dateOfIncorporation) => onChange({ dateOfIncorporation })}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          error={errors.dateOfIncorporation}
        />
      </View>
    </>
  );
}
