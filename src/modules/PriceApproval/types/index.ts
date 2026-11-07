/** Statuses the list endpoint accepts as a filter. */
export type PriceApprovalStatus = 'DRAFT' | 'AWAITING' | 'PENDING' | 'FINISH' | 'REJECTED' | 'CANCELED';

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
