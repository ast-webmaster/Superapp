/** Pagination of the list answer. */
export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** One row of `GET /v1/customer`, as the server sends it. Optional columns are null when empty. */
export type CustomerListItem = {
  id: number;
  /** The customer code (`C-00123`), not the row id. */
  customer_id: string;
  customer_name: string;
  office_code: string | null;
  office_name: string | null;
  /** Free text, not a fixed list. */
  category: string | null;
  customer_address: string | null;
  phone: string | null;
  taxation_status: string | null;
  pic_name: string | null;
  pic_number: string | null;
  pic_email: string | null;
  /** `YYYY-MM-DD`. */
  created_at: string | null;
};

/** An address beside the main and the shipping address. */
export type CustomerAddress = {
  uuid: string;
  address: string;
  created_by: string | null;
  created_at: string | null;
};

/** Who asked for the change that waits for finance, and when. Never the change itself. */
export type CustomerPendingChange = {
  uuid: string;
  requested_by: string | null;
  requested_at: string | null;
};

/** `GET /v1/customer/{id}`. */
export type CustomerDetail = Omit<CustomerListItem, 'created_at'> & {
  shipping_address: string | null;
  /** `SAME` or `DIFFERENT`. */
  shipping_address_type: string | null;
  fax: string | null;
  website: string | null;
  whatsapp_no: string | null;
  whatsapp_no_second: string | null;
  status_of_business: string | null;
  forms_of_business: string | null;
  /** `YYYY-MM-DD`. */
  date_of_incorporation: string | null;
  tax_id_number: string | null;
  business_id_number: string | null;
  /** `YES` or `NO`. */
  is_grouping: string | null;
  grouping_company_name: string | null;
  pic_department: string | null;
  owner_name: string | null;
  id_card_number: string | null;
  owner_address: string | null;
  owner_address_now: string | null;
  /** `SAME` or `DIFFERENT`. */
  owner_address_now_type: string | null;
  /** A change waits for finance approval. */
  is_locked: boolean;
  pending_change: CustomerPendingChange | null;
  addresses: CustomerAddress[];
  updated_by: string | null;
  /** ISO 8601. */
  created_at: string | null;
  updated_at: string | null;
};

export type CustomerPage = {
  items: CustomerListItem[];
  meta: PageMeta;
};
