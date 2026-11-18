import { View } from 'react-native';

import { AppText, TextField } from '@/shared/ui';

import type { Errors } from '../../create/draft';
import { ADDRESS_TYPES } from '../../create/options';
import type { RegisterCustomerDraft } from '../../types';
import { ChoiceField } from './choice-field';

export interface ContactStepProps {
  draft: RegisterCustomerDraft;
  onChange: (patch: Partial<RegisterCustomerDraft>) => void;
  /** Field errors to show. Empty until the user tries to continue. */
  errors: Errors;
}

export function ContactStep({ draft, onChange, errors }: ContactStepProps) {
  return (
    <>
      <View className="gap-4">
        <AppText variant="title" role="heading">
          Contact person
        </AppText>
        <TextField
          label="Name"
          required
          value={draft.picName}
          onChangeText={(picName) => onChange({ picName })}
          maxLength={191}
          error={errors.picName}
        />
        <TextField
          label="Phone"
          required
          value={draft.picNumber}
          onChangeText={(picNumber) => onChange({ picNumber })}
          keyboardType="phone-pad"
          maxLength={16}
          error={errors.picNumber}
        />
        <TextField
          label="Email"
          required
          value={draft.picEmail}
          onChangeText={(picEmail) => onChange({ picEmail })}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={191}
          error={errors.picEmail}
        />
        <TextField
          label="Department"
          required
          value={draft.picDepartment}
          onChangeText={(picDepartment) => onChange({ picDepartment })}
          maxLength={191}
          error={errors.picDepartment}
        />
      </View>

      <View className="gap-4">
        <AppText variant="title" role="heading">
          Owner
        </AppText>
        <TextField
          label="Name"
          required
          value={draft.ownerName}
          onChangeText={(ownerName) => onChange({ ownerName })}
          maxLength={191}
          error={errors.ownerName}
        />
        <TextField
          label="ID card number"
          value={draft.idCardNumber}
          onChangeText={(text) => onChange({ idCardNumber: text.replace(/\D/g, '') })}
          keyboardType="number-pad"
          maxLength={16}
          help="16 digits."
          error={errors.idCardNumber}
        />
        <TextField
          label="Address"
          required
          value={draft.ownerAddress}
          onChangeText={(ownerAddress) => onChange({ ownerAddress })}
          maxLength={191}
          error={errors.ownerAddress}
          multiline
          textAlignVertical="top"
          className="min-h-24"
        />
        <ChoiceField
          label="Current address"
          required
          options={ADDRESS_TYPES}
          value={draft.ownerAddressNowType}
          onChange={(ownerAddressNowType) => onChange({ ownerAddressNowType })}
          error={errors.ownerAddressNowType}
        />
        {draft.ownerAddressNowType === 'DIFFERENT' ? (
          <TextField
            label="Current address details"
            required
            value={draft.ownerAddressNow}
            onChangeText={(ownerAddressNow) => onChange({ ownerAddressNow })}
            error={errors.ownerAddressNow}
            multiline
            textAlignVertical="top"
            className="min-h-24"
          />
        ) : null}
      </View>
    </>
  );
}
