import type { DocumentKey, RegisterCustomerDraft } from '../types';
import { ID_CARD_FORMS } from './options';

/** The server refuses a document over 2 MB, so a bigger one is never sent. */
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const DOCUMENT_EXTENSIONS = ['jpeg', 'jpg', 'png', 'pdf'];

export const STEPS = [
  { key: 'customer', title: 'Customer' },
  { key: 'contact', title: 'Contact and owner' },
  { key: 'documents', title: 'Documents' },
  { key: 'review', title: 'Review' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

export const emptyDraft: RegisterCustomerDraft = {
  category: null,
  customerName: '',
  customerAddress: '',
  shippingAddressType: null,
  shippingAddress: '',
  phone: '',
  fax: '',
  website: '',
  statusOfBusiness: null,
  formsOfBusiness: null,
  dateOfIncorporation: '',
  taxationStatus: null,
  taxIdNumber: '',
  businessIdCardNumber: '',
  businessIdNumber: '',
  picName: '',
  picNumber: '',
  picEmail: '',
  picDepartment: '',
  ownerName: '',
  idCardNumber: '',
  ownerAddress: '',
  ownerAddressNowType: null,
  ownerAddressNow: '',
  isGrouping: null,
  groupingCompanyName: '',
  documents: {},
};

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

/** Whether this business is identified by an ID card number (otherwise by a tax number). */
export const usesIdCard = (draft: RegisterCustomerDraft) =>
  draft.formsOfBusiness !== null && ID_CARD_FORMS.includes(draft.formsOfBusiness);

/**
 * Whether a document is asked for. Same rules as the server: the ID card and tax ID always; the
 * address statement when the shipping address differs; the deed and the grouping permit when the
 * customer belongs to a group. A hidden document is neither shown nor sent.
 */
export function documentRequirement(
  key: DocumentKey,
  draft: RegisterCustomerDraft,
): 'required' | 'optional' | 'hidden' {
  const grouped = draft.isGrouping === 'YES';
  switch (key) {
    case 'doc_id_card':
    case 'doc_tax_id':
      return 'required';
    case 'doc_different_address_statement':
      return draft.shippingAddressType === 'DIFFERENT' ? 'required' : 'hidden';
    case 'doc_memorandum_of_association':
      return grouped ? 'required' : 'optional';
    case 'doc_grouping_permit':
      return grouped ? 'required' : 'hidden';
    default:
      return 'optional';
  }
}

const blank = (value: string) => value.trim() === '';

/** A real calendar day written as YYYY-MM-DD. */
function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function validateCustomer(draft: RegisterCustomerDraft): Errors {
  const errors: Errors = {};
  if (!draft.category) errors.category = 'Choose a category.';
  if (blank(draft.customerName)) errors.customerName = 'Enter the customer name.';
  if (blank(draft.customerAddress)) errors.customerAddress = 'Enter the address.';
  if (!draft.shippingAddressType) errors.shippingAddressType = 'Choose the shipping address.';
  if (draft.shippingAddressType === 'DIFFERENT' && blank(draft.shippingAddress)) {
    errors.shippingAddress = 'Enter the shipping address.';
  }
  if (blank(draft.phone)) errors.phone = 'Enter a phone number.';
  if (!draft.formsOfBusiness) errors.formsOfBusiness = 'Choose a business form.';
  if (!draft.taxationStatus) errors.taxationStatus = 'Choose a tax status.';
  if (draft.formsOfBusiness) {
    if (usesIdCard(draft)) {
      if (!/^\d{16}$/.test(draft.businessIdCardNumber)) {
        errors.businessIdCardNumber = 'Enter the 16-digit ID card number.';
      }
    } else if (blank(draft.taxIdNumber)) {
      errors.taxIdNumber = 'Enter the tax ID number.';
    }
  }
  if (!blank(draft.dateOfIncorporation) && !isValidDate(draft.dateOfIncorporation)) {
    errors.dateOfIncorporation = 'Use the format YYYY-MM-DD, for example 2015-03-24.';
  }
  return errors;
}

export function validateContact(draft: RegisterCustomerDraft): Errors {
  const errors: Errors = {};
  if (blank(draft.picName)) errors.picName = 'Enter the contact name.';
  if (blank(draft.picNumber)) errors.picNumber = 'Enter the contact phone number.';
  if (blank(draft.picEmail)) errors.picEmail = 'Enter the contact email.';
  else if (!/^\S+@\S+\.\S+$/.test(draft.picEmail.trim())) {
    errors.picEmail = 'Enter a valid email address.';
  }
  if (blank(draft.picDepartment)) errors.picDepartment = 'Enter the contact department.';
  if (blank(draft.ownerName)) errors.ownerName = 'Enter the owner name.';
  if (!blank(draft.idCardNumber) && !/^\d{16}$/.test(draft.idCardNumber)) {
    errors.idCardNumber = 'Enter the 16-digit ID card number.';
  }
  if (blank(draft.ownerAddress)) errors.ownerAddress = 'Enter the owner address.';
  if (!draft.ownerAddressNowType) errors.ownerAddressNowType = 'Choose the current address.';
  if (draft.ownerAddressNowType === 'DIFFERENT' && blank(draft.ownerAddressNow)) {
    errors.ownerAddressNow = 'Enter the current address.';
  }
  return errors;
}

/** The problem with one chosen file, or null when it can be sent. */
export function documentProblem(file: { name: string; size: number | null }): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!DOCUMENT_EXTENSIONS.includes(extension)) return 'Use a JPG, PNG or PDF file.';
  if (file.size !== null && file.size > MAX_DOCUMENT_BYTES) return 'This file is larger than 2 MB.';
  return null;
}

export function validateDocuments(draft: RegisterCustomerDraft): Errors {
  const errors: Errors = {};
  if (!draft.isGrouping) errors.isGrouping = 'Choose yes or no.';
  if (draft.isGrouping === 'YES' && blank(draft.groupingCompanyName)) {
    errors.groupingCompanyName = 'Enter the group company name.';
  }
  for (const key of Object.keys(draft.documents) as DocumentKey[]) {
    const file = draft.documents[key];
    const problem = file ? documentProblem(file) : null;
    if (problem && documentRequirement(key, draft) !== 'hidden') errors[key] = problem;
  }
  for (const key of ['doc_id_card', 'doc_tax_id', 'doc_different_address_statement', 'doc_memorandum_of_association', 'doc_grouping_permit'] as const) {
    if (documentRequirement(key, draft) === 'required' && !draft.documents[key]) {
      errors[key] = 'Add this document.';
    }
  }
  return errors;
}

export function validateStep(step: StepKey, draft: RegisterCustomerDraft): Errors {
  if (step === 'customer') return validateCustomer(draft);
  if (step === 'contact') return validateContact(draft);
  if (step === 'documents') return validateDocuments(draft);
  return {};
}

/** The first step that holds a problem, so Submit can send the user back to it. */
export function firstInvalidStep(draft: RegisterCustomerDraft): StepKey | null {
  return STEPS.find(({ key }) => Object.keys(validateStep(key, draft)).length > 0)?.key ?? null;
}

/** True once the user has typed or chosen anything, so leaving asks first. */
export function isDirty(draft: RegisterCustomerDraft): boolean {
  return (Object.keys(emptyDraft) as (keyof RegisterCustomerDraft)[]).some((key) =>
    key === 'documents'
      ? Object.keys(draft.documents).length > 0
      : draft[key] !== emptyDraft[key],
  );
}
