/** Statuses of a document. The list filter takes these, alone or joined with commas. */
export type ProductBorrowingStatus =
  | 'AWAITING APPROVAL'
  | 'AWAITING PROCESS'
  | 'BORROWED'
  | 'RECEIVED'
  | 'REQUEST EXTEND'
  | 'REVISE'
  | 'REJECTED'
  | 'CANCELED';

/**
 * Everything the user can narrow the list by. `status` is `'all'`, one status, or several joined
 * with commas (the API accepts that); a status the app does not know still goes through as is.
 */
export type ProductBorrowingListFilters = {
  status: string;
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** One row of `GET /product-borrowing`. Field names follow the wire format. */
export type ProductBorrowingListItem = {
  uuid: string;
  product_borrowing_no: string;
  /** YYYY-MM-DD */
  product_borrowing_date: string;
  /** Not narrowed to `ProductBorrowingStatus`: show values the app does not know as they are. */
  status: string;
  customer_name: string | null;
  total_items: number;
  total_qty: number;
  last_updated_tier: string | null;
  /** Who holds the current stage. */
  last_updated_names: string[];
  /** Email of the requester. */
  requester: string;
  requester_name: string | null;
  /** The document waits for the signed-in user. */
  awaiting_me: boolean;
};

/**
 * What the signed-in user may do on one document, sent to `POST /{uuid}/actions`. The server
 * decides; the app only shows these.
 */
export type ProductBorrowingAction =
  | 'approve'
  | 'reject'
  | 'revise'
  | 'process'
  | 'receive'
  | 'approve_extend'
  | 'reject_extend'
  | 'cancel';

export type ProductBorrowingActionInput = {
  action: ProductBorrowingAction;
  remarks?: string;
  /** The `updated_at` of the detail the user looked at. */
  updatedAt: string;
};

export type ExtendInput = {
  /** YYYY-MM-DD, the new return date. */
  endDate: string;
  reason: string;
  updatedAt: string;
};

export type ProductBorrowingExtend = {
  id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
};

export type ProductBorrowingItem = {
  id: number;
  product_code: string;
  product_name: string | null;
  warehouse: string;
  qty: number;
  /** YYYY-MM-DD */
  start_date: string;
  end_date: string;
  estimate_return: string | null;
  received_date: string | null;
  status: string;
  product_manager: string | null;
  product_manager_name: string | null;
  marketing: string | null;
  marketing_name: string | null;
  remarks: string | null;
  extends: ProductBorrowingExtend[];
};

/** One row of the approval log: who acted, or who is still to act (`action_at` is null). */
export type ProductBorrowingStep = {
  tier: string;
  user_email: string | null;
  user_name: string | null;
  status: string;
  remarks: string | null;
  action_at: string | null;
};

/** `GET /product-borrowing/{uuid}`, and what every write answers with. */
export type ProductBorrowingDetail = ProductBorrowingListItem & {
  /** ISO 8601. Sent back with every write as the concurrency reference. */
  updated_at: string;
  /** The `ProductBorrowingAction`s, plus `edit` and `extend`, which have their own endpoints. */
  allowed_actions: string[];
  customer_id: string | null;
  address: string | null;
  phone: string | null;
  pic_receiver: string | null;
  note: string | null;
  items: ProductBorrowingItem[];
  approvements: ProductBorrowingStep[];
};

export type PersonOption = {
  email: string;
  name: string | null;
};

/** `GET /product-borrowing/options`, the pickers of the form. */
export type ProductBorrowingOptions = {
  warehouses: string[];
  product_managers: PersonOption[];
  marketing: PersonOption[];
};

export type CustomerOption = {
  customer_id: string;
  customer_name: string | null;
};

/** A product with stock in one warehouse (`GET /stock`). */
export type StockOption = {
  product_code: string;
  product_name: string | null;
  /** Null for a product restored from a saved document: its stock is not known until re-picked. */
  available: number | null;
  /** Email, or null when the product's category has no product manager yet. */
  product_manager: string | null;
};

export type DraftItem = {
  /** A local id for lists and editing. Never sent to the server. */
  id: string;
  warehouse: string | null;
  product: StockOption | null;
  /** Digits only while typing. */
  qty: string;
  /** YYYY-MM-DD, both set or both null. */
  startDate: string | null;
  endDate: string | null;
  productManager: PersonOption | null;
  marketing: PersonOption | null;
  remarks: string;
};

export type ProductBorrowingDraft = {
  customer: CustomerOption | null;
  address: string;
  phone: string;
  picReceiver: string;
  note: string;
  items: DraftItem[];
};
