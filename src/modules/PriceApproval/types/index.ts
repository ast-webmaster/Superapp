/** Statuses the list endpoint accepts as a filter. */
export type PriceApprovalStatus =
  'DRAFT' | 'AWAITING' | 'PENDING' | 'FINISH' | 'REJECTED' | 'CANCELED';

/** The list screen can show one status or everything. */
export type PriceApprovalFilter = PriceApprovalStatus | 'all';

/** One row of `GET /price-approval`. Field names follow the wire format. */
export type PriceApprovalListItem = {
  pa_uuid: string;
  pa_no: string;
  /** YYYY-MM-DD */
  pa_date: string;
  /** Not narrowed to `PriceApprovalStatus`: show values the app does not know as they are. */
  status: string;
  last_updated_tier: string | null;
  grand_total: number;
  items_count: number;
  customer_id: string | null;
  customer_name: string | null;
  request_by: string;
  request_by_name: string | null;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** What the signed-in user may do on one request. The server decides; the app only shows these. */
export type PriceApprovalAction = 'approve' | 'reject' | 'pending' | 'no_approval_needed';

export type PriceApprovalLine = {
  sku_no: string;
  product_name: string | null;
  brand_name: string | null;
  category_name: string | null;
  /** Product manager: email and display name. */
  pm: string;
  pm_name: string | null;
  remark: string | null;
  qty: number;
  price: number;
  /** Kind of discount: '1' none, '2' percent, '3' nominal. */
  discount: string | null;
  percent: number;
  nominal: number;
  price_after_discount: number;
  cash_discount: number;
  amount: number;
};

/** One tier's step in the approval chain (sales, product manager, sales admin, finance, accounting). */
export type PriceApprovalStep = {
  user_name: string | null;
  tier: string;
  status: string;
  action_at: string | null;
  remarks: string | null;
};

/** `GET /price-approval/{uuid}` and the response of an action. */
export type PriceApprovalDetail = {
  pa_uuid: string;
  pa_no: string;
  pa_date: string;
  order_date: string | null;
  status: string;
  /** ISO 8601. Sent back with an action so the server can refuse it if the request changed since. */
  updated_at: string;
  allowed_actions: PriceApprovalAction[];
  po_sc: string | null;
  payment_type: string | null;
  category: string | null;
  shipment: string | null;
  shipping_note: string | null;
  remarks: string | null;
  grand_total: number;
  assembly_no: string | null;
  customer_id: string | null;
  customer_name: string | null;
  request_by: string;
  request_by_name: string | null;
  details: PriceApprovalLine[];
  approvements: PriceApprovalStep[];
};

export type PriceApprovalActionInput = {
  action: PriceApprovalAction;
  remarks?: string;
  /** `updated_at` of the detail the user acted on. */
  updatedAt: string;
};
