import { toUploadBlob } from '@/core/files';

import { documentRequirement, usesIdCard } from '../create/draft';
import { DOCUMENTS } from '../create/options';
import type { RegisterCustomerDraft } from '../types';

/**
 * The body of `POST /register-customer`, multipart because the documents are files. The draft
 * must already be valid (see `create/draft.ts`), so the required fields are never null. Only the
 * identity number that fits the business form is sent, and a field that only applies to a
 * "different" address or to a group is sent only then, as the server expects.
 */
export async function buildCreateForm(draft: RegisterCustomerDraft): Promise<FormData> {
  const form = new FormData();
  const text = (name: string, value: string | null) => {
    const trimmed = value?.trim() ?? '';
    if (trimmed) form.append(name, trimmed);
  };

  text('category', draft.category);
  text('customer_name', draft.customerName);
  text('customer_address', draft.customerAddress);
  text('shipping_address_type', draft.shippingAddressType);
  if (draft.shippingAddressType === 'DIFFERENT') text('shipping_address', draft.shippingAddress);
  text('phone', draft.phone);
  text('fax', draft.fax);
  text('website', draft.website);
  text('status_of_business', draft.statusOfBusiness);
  text('forms_of_business', draft.formsOfBusiness);
  text('date_of_incorporation', draft.dateOfIncorporation);
  text('taxation_status', draft.taxationStatus);
  if (usesIdCard(draft)) text('business_id_card_number', draft.businessIdCardNumber);
  else text('tax_id_number', draft.taxIdNumber);
  text('business_id_number', draft.businessIdNumber);

  text('pic_name', draft.picName);
  text('pic_number', draft.picNumber);
  text('pic_email', draft.picEmail);
  text('pic_department', draft.picDepartment);
  text('owner_name', draft.ownerName);
  text('id_card_number', draft.idCardNumber);
  text('owner_address', draft.ownerAddress);
  text('owner_address_now_type', draft.ownerAddressNowType);
  if (draft.ownerAddressNowType === 'DIFFERENT') text('owner_address_now', draft.ownerAddressNow);

  text('is_grouping', draft.isGrouping);
  if (draft.isGrouping === 'YES') text('grouping_company_name', draft.groupingCompanyName);

  for (const { key } of DOCUMENTS) {
    const file = draft.documents[key];
    if (file && documentRequirement(key, draft) !== 'hidden') {
      form.append(key, await toUploadBlob(file), file.name);
    }
  }
  return form;
}
