import type { AddressType, DocumentKey, YesNo } from '../types';

/**
 * The dropdown values the server accepts (`RegisterCustomerReferenceService`). The API has no
 * endpoint for them, so they live here; the server refuses anything else with a 422.
 */
export const CATEGORIES = [
  'Corporate',
  'Dealer',
  'Master Dealer',
  'Modern Channel',
  'Onlineshop',
  'System Integrator',
] as const;

export const FORMS_OF_BUSINESS = ['PT', 'CV', 'UD', 'TOKO', 'PERORANGAN'] as const;

/** These forms identify the business by the owner's ID card number; the others use a tax number. */
export const ID_CARD_FORMS: readonly string[] = ['TOKO', 'PERORANGAN'];

export const STATUS_OF_BUSINESS = ['Milik Sendiri', 'Sewa'] as const;

export const TAXATION_STATUS = [
  { value: 'PKP', label: 'PKP' },
  { value: 'NON-PKP', label: 'Non-PKP' },
] as const;

export const ADDRESS_TYPES: readonly { value: AddressType; label: string }[] = [
  { value: 'SAME', label: 'Same as above' },
  { value: 'DIFFERENT', label: 'Different' },
];

export const YES_NO: readonly { value: YesNo; label: string }[] = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
];

/** Every upload, labelled as the web checklist ("Checklist Kelengkapan Data") names them. */
export const DOCUMENTS: readonly { key: DocumentKey; label: string }[] = [
  { key: 'doc_id_card', label: 'Director or owner ID card' },
  { key: 'doc_tax_id', label: 'Tax ID (NPWP)' },
  { key: 'doc_different_address_statement', label: 'Different address statement' },
  { key: 'doc_memorandum_of_association', label: 'Deed of establishment or amendment' },
  { key: 'doc_grouping_permit', label: 'Grouping permit' },
  { key: 'doc_sppkp', label: 'SPPKP' },
  { key: 'doc_siup_tdp', label: 'SIUP and TDP' },
  { key: 'doc_business_id_number', label: 'Business ID (NIB)' },
  { key: 'doc_business_photo', label: 'Photo of the business place' },
  { key: 'doc_others', label: 'Other documents' },
];
