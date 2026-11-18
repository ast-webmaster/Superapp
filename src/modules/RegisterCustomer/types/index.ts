import type { PickedFile } from '@/core/files';

/** Everything the user can narrow the list by. `'all'` and `null` mean no narrowing. */
export type RegisterCustomerListFilters = {
  /** One status, or several joined by commas (the server accepts both). */
  status: string;
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

/** One row of `GET /register-customer`. Field names follow the wire format. */
export type RegisterCustomerListItem = {
  uuid: string;
  register_customer_no: string;
  /** YYYY-MM-DD */
  register_date: string;
  customer_name: string;
  category: string;
  forms_of_business: string;
  /** Not narrowed: show values the app does not know as they are. */
  status: string;
  last_updated_names: string | null;
  requester: string;
  requester_name: string | null;
  /** True when this user has a step to act on. */
  awaiting_me: boolean;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** What the signed-in user may do on one document. The server decides; the app only shows these. */
export type RegisterCustomerAction = 'confirm' | 'approve' | 'reject' | 'revise';

/** The step the document waits at for this user, or null when it does not wait for them. */
export type RegisterCustomerStage = 'CONFIRMATION' | 'MANAGER' | 'FINANCE';

/** Keys of the uploaded documents. Also the multipart field names of the create request. */
export type DocumentKey =
  | 'doc_id_card'
  | 'doc_tax_id'
  | 'doc_different_address_statement'
  | 'doc_memorandum_of_association'
  | 'doc_grouping_permit'
  | 'doc_sppkp'
  | 'doc_siup_tdp'
  | 'doc_business_id_number'
  | 'doc_business_photo'
  | 'doc_others';

export type RegisterCustomerDocument = {
  key: string;
  label: string;
  file: string;
};

export type RegisterCustomerAttachment = {
  id: number;
  file: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string | null;
};

/** One row of the approval log. */
export type RegisterCustomerStep = {
  user_name: string | null;
  user_email: string | null;
  status: string;
  remarks: string | null;
  action_at: string | null;
};

/** `GET /register-customer/{uuid}` and the response of an action or of creating one. */
export type RegisterCustomerDetail = {
  uuid: string;
  register_customer_no: string;
  register_date: string;
  status: string;
  /** ISO 8601. Sent back with an action so the server can refuse it if the document changed since. */
  updated_at: string;
  allowed_actions: RegisterCustomerAction[];
  awaiting_me: boolean;
  awaiting_stage: RegisterCustomerStage | null;
  customer_code: string | null;
  category: string;
  customer_name: string;
  customer_address: string;
  shipping_address_type: string;
  shipping_address: string | null;
  phone: string | null;
  fax: string | null;
  website: string | null;
  status_of_business: string | null;
  forms_of_business: string;
  date_of_incorporation: string | null;
  taxation_status: string;
  tax_id_number: string | null;
  business_id_card_number: string | null;
  business_id_number: string | null;
  is_grouping: string;
  grouping_company_name: string | null;
  pic_name: string;
  pic_number: string;
  pic_email: string;
  pic_department: string;
  owner_name: string;
  id_card_number: string | null;
  owner_address: string;
  owner_address_now_type: string;
  owner_address_now: string | null;
  requester: string;
  requester_name: string | null;
  last_updated_names: string | null;
  documents: RegisterCustomerDocument[];
  attachments: RegisterCustomerAttachment[];
  approvements: RegisterCustomerStep[];
};

export type RegisterCustomerActionInput = {
  action: RegisterCustomerAction;
  remarks?: string;
  /** Only the finance approval needs it: the code the new customer gets in the master data. */
  customerCode?: string;
  /** `updated_at` of the detail the user acted on. */
  updatedAt: string;
};

export type AddressType = 'SAME' | 'DIFFERENT';
export type YesNo = 'YES' | 'NO';

/** Everything the create flow collects. Held in the screen, never in the query cache. */
export type RegisterCustomerDraft = {
  category: string | null;
  customerName: string;
  customerAddress: string;
  shippingAddressType: AddressType | null;
  shippingAddress: string;
  phone: string;
  fax: string;
  website: string;
  statusOfBusiness: string | null;
  formsOfBusiness: string | null;
  /** YYYY-MM-DD, or empty. */
  dateOfIncorporation: string;
  taxationStatus: string | null;
  taxIdNumber: string;
  businessIdCardNumber: string;
  businessIdNumber: string;
  picName: string;
  picNumber: string;
  picEmail: string;
  picDepartment: string;
  ownerName: string;
  idCardNumber: string;
  ownerAddress: string;
  ownerAddressNowType: AddressType | null;
  ownerAddressNow: string;
  isGrouping: YesNo | null;
  groupingCompanyName: string;
  documents: Partial<Record<DocumentKey, PickedFile>>;
};
