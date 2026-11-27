import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText, IconButton } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { documentRequirement, usesIdCard, type StepKey } from '../../create/draft';
import { ADDRESS_TYPES, DOCUMENTS } from '../../create/options';
import type { RegisterCustomerDraft } from '../../types';
import { formatFileSize } from './documents-step';

function Section({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText variant="title" role="heading">
          {title}
        </AppText>
        <IconButton size="sm" icon="pencil" label={editLabel} onPress={onEdit} />
      </View>
      <View className="gap-3 rounded-xl shadow-card bg-surface p-4">{children}</View>
    </View>
  );
}

/** A label over its value, so a long name wraps instead of being cut off. Empty values are left out. */
function Pair({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <View className="gap-1">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="body-strong">{text}</AppText>
    </View>
  );
}

const addressChoice = (type: string | null, details: string) =>
  type === 'DIFFERENT' ? details : ADDRESS_TYPES.find((option) => option.value === type)?.label;

export interface ReviewStepProps {
  draft: RegisterCustomerDraft;
  onEdit: (step: StepKey) => void;
}

export function ReviewStep({ draft, onEdit }: ReviewStepProps) {
  const documents = DOCUMENTS.filter(
    ({ key }) => documentRequirement(key, draft) !== 'hidden' && draft.documents[key],
  );

  return (
    <>
      <Section title="Customer" editLabel="Edit customer" onEdit={() => onEdit('customer')}>
        <Pair label="Category" value={draft.category} />
        <Pair label="Customer name" value={draft.customerName} />
        <Pair label="Address" value={draft.customerAddress} />
        <Pair
          label="Shipping address"
          value={addressChoice(draft.shippingAddressType, draft.shippingAddress)}
        />
        <Pair label="Phone" value={draft.phone} />
        <Pair label="Fax" value={draft.fax} />
        <Pair label="Website" value={draft.website} />
        <Pair label="Business form" value={draft.formsOfBusiness} />
        <Pair label="Business status" value={draft.statusOfBusiness} />
        <Pair label="Tax status" value={draft.taxationStatus} />
        <Pair
          label={usesIdCard(draft) ? 'ID card number' : 'Tax ID (NPWP)'}
          value={usesIdCard(draft) ? draft.businessIdCardNumber : draft.taxIdNumber}
        />
        <Pair label="Business ID (NIB)" value={draft.businessIdNumber} />
        <Pair
          label="Date established"
          value={draft.dateOfIncorporation ? formatDate(draft.dateOfIncorporation) : null}
        />
      </Section>

      <Section
        title="Contact and owner"
        editLabel="Edit contact and owner"
        onEdit={() => onEdit('contact')}>
        <Pair label="Contact name" value={draft.picName} />
        <Pair label="Contact phone" value={draft.picNumber} />
        <Pair label="Contact email" value={draft.picEmail} />
        <Pair label="Contact department" value={draft.picDepartment} />
        <Pair label="Owner name" value={draft.ownerName} />
        <Pair label="Owner ID card number" value={draft.idCardNumber} />
        <Pair label="Owner address" value={draft.ownerAddress} />
        <Pair
          label="Current address"
          value={addressChoice(draft.ownerAddressNowType, draft.ownerAddressNow)}
        />
      </Section>

      <Section
        title={`Documents (${documents.length})`}
        editLabel="Edit documents"
        onEdit={() => onEdit('documents')}>
        <Pair
          label="Part of a group"
          value={
            draft.isGrouping === 'YES'
              ? `Yes, ${draft.groupingCompanyName.trim()}`
              : draft.isGrouping === 'NO'
                ? 'No'
                : null
          }
        />
        {documents.map(({ key, label }) => {
          const file = draft.documents[key];
          return (
            <Pair
              key={key}
              label={label}
              value={
                file && file.size !== null
                  ? `${file.name} · ${formatFileSize(file.size)}`
                  : file?.name
              }
            />
          );
        })}
      </Section>
    </>
  );
}
