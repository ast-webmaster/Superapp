import type { PickedFile } from '@/core/files';

/** Statuses the list endpoint accepts as a filter. */
export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'SUBMISSION'
  | 'AWAITING'
  | 'APPROVED'
  | 'PROCESSED'
  | 'REVISE'
  | 'REJECTED'
  | 'CANCELED'
  | 'COMPLETED'
  | 'RECEIVED';

/** The list screen can show one status or everything. */
export type PurchaseRequestFilter = PurchaseRequestStatus | 'all';

/** Everything the user can narrow the list by. `null` and `'all'` mean no narrowing. */
export type PurchaseRequestListFilters = {
  status: PurchaseRequestFilter;
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

/** One row of `GET /purchase-request`. Field names follow the wire format. */
export type PurchaseRequestListItem = {
  uuid: string;
  pr_no: string;
  /** YYYY-MM-DD */
  pr_date: string;
  /** Not narrowed to `PurchaseRequestStatus`: show values the app does not know as they are. */
  status: string;
  purpose: string | null;
  category: string | null;
  grand_total: number;
  items_count: number;
  /** Email of the requester. */
  requester: string;
  requester_name: string | null;
  last_updated_name: string | null;
  /** The request waits for the signed-in user. */
  awaiting_me: boolean;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** What the signed-in user may do on one request. The server decides; the app only shows these. */
export type PurchaseRequestAction = 'approve' | 'process' | 'reject' | 'revise';

export type PurchaseRequestVendor = {
  id: number;
  company_name: string | null;
  address: string | null;
  phone: string | null;
};

export type PurchaseRequestOffice = {
  id: number;
  office_name: string | null;
  address: string | null;
  phone: string | null;
};

export type PurchaseRequestLine = {
  id: number;
  item_code: string | null;
  item_no: string | null;
  item_description: string | null;
  uom: string | null;
  category: string | null;
  qty: number;
  unit_price: number;
  last_price: number;
  amount: number;
  stock_on_hand: number | null;
  /** YYYY-MM-DD */
  due_date: string | null;
  remarks: string | null;
  status_purchase: string | null;
  received_at: string | null;
  /** The signed-in user may receive this item now. The server decides; the app only shows it. */
  can_receive: boolean;
  /** File name of the supporting document, when the item has one. */
  document: string | null;
};

export type PurchaseRequestAttachment = {
  id: number;
  file: string;
  description: string | null;
};

/** One tier's step in the approval chain. */
export type PurchaseRequestStep = {
  user_name: string | null;
  tier: string;
  status: string;
  approved_at: string | null;
  remarks: string | null;
};

/** `GET /purchase-request/{uuid}` and the response of an action or a create. */
export type PurchaseRequestDetail = {
  uuid: string;
  pr_no: string;
  pr_date: string;
  status: string;
  /** ISO 8601. Sent back with an action so the server can refuse it if the request changed since. */
  updated_at: string;
  allowed_actions: PurchaseRequestAction[];
  reference: string | null;
  purpose: string | null;
  category: string | null;
  payment_method: string | null;
  destination: string | null;
  remarks: string | null;
  grand_total: number;
  from_assembly: boolean;
  requester: string;
  requester_name: string | null;
  department_name: string | null;
  last_updated_name: string | null;
  vendor: PurchaseRequestVendor | null;
  vendor_reference: string | null;
  delivery_address: PurchaseRequestOffice | null;
  items: PurchaseRequestLine[];
  attachments: PurchaseRequestAttachment[];
  approvements: PurchaseRequestStep[];
};

export type PurchaseRequestActionInput = {
  action: PurchaseRequestAction;
  remarks?: string;
  /** `updated_at` of the detail the user acted on. */
  updatedAt: string;
};

/** One row of `GET /purchase-request/vendors`. */
export type VendorOption = {
  id: number;
  vendor_code: string | null;
  company_name: string | null;
};

/** One row of `GET /purchase-request/offices`. */
export type OfficeOption = {
  id: number;
  office_name: string | null;
};

/** One row of `GET /purchase-request/items`: an item the user may pick on a new request. */
export type ItemOption = {
  item_code: string;
  item_no: string | null;
  item_description: string | null;
  uom: string | null;
  last_price: number;
};

export type RequestCategory = 'STOCK' | 'NON STOCK';
export type PaymentMethod = 'COD' | 'CBD' | 'BANK TRANSFER' | 'CREDIT CARD' | 'CN' | 'OTHERS';
export type ItemCategory = 'TRADE' | 'FIXED ASSET' | 'EVENT' | 'OTHERS';
/** A registered item, or a name the user types for something not in the list yet. */
export type ItemSource = 'registered' | 'new';

/** Numbers are kept as the text the user typed, so a half-typed "1." survives a re-render. */
export type DraftItem = {
  /** Local id for list keys and editing. Never sent. */
  id: string;
  source: ItemSource;
  item: ItemOption | null;
  newName: string;
  category: ItemCategory | null;
  qty: string;
  unitPrice: string;
  stockOnHand: string;
  /** YYYY-MM-DD, or null when no date is set. */
  dueDate: string | null;
  remarks: string;
  /** Required for TRADE and EVENT items. */
  document: PickedFile | null;
};

export type DraftAttachment = {
  id: string;
  description: string;
  file: PickedFile;
};

/** Everything the create flow collects. Held in the screen, never in the query cache. */
export type PurchaseRequestDraft = {
  purpose: string;
  category: RequestCategory | null;
  office: OfficeOption | null;
  paymentMethod: PaymentMethod | null;
  reference: string;
  vendor: VendorOption | null;
  vendorReference: string;
  items: DraftItem[];
  attachments: DraftAttachment[];
};
