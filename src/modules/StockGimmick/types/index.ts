/** Pagination of the list answer. */
export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** One row of `GET /v1/stock-gimmick`: one gimmick item in one office. */
export type StockListItem = {
  id: number;
  product_code: string;
  /** Null when the item master is gone. */
  product_name: string | null;
  office_id: number;
  /** Null when the office is gone. */
  office_name: string | null;
  qty: number;
  /** The document that last moved this row, or null. */
  last_transaction_no: string | null;
  updated_at: string | null;
};

/** `GET /v1/stock-gimmick/{id}`. */
export type StockDetail = StockListItem & {
  /** What the last document was, for example "Outbound Diajukan". */
  last_transaction_label: string | null;
  /** Absolute URL of the item's picture, or null. */
  image_url: string | null;
  created_at: string | null;
};

/** `inbound`, `outbound`, `request`, `approved`, `returned` or `opening`. Kept open: the backend adds kinds. */
export type MovementKind = string;

/** One event of Track Stock, newest first. `qty` is signed: minus takes stock, plus adds it. */
export type StockMovement = {
  /** Null for the opening balance, which has no date. */
  occurred_at: string | null;
  do_no: string | null;
  event: string;
  kind: MovementKind;
  /** `IN`, `OUT` or `FLAT`. */
  direction: string;
  /** The office on the other side of the document, or "-". */
  party: string;
  qty: number;
  /** Stock after this event. */
  balance: number;
  /** The document still waits for an action: stock is already taken but not settled. */
  pending: boolean;
};

export type MovementSummary = {
  current_qty: number;
  total_in: number;
  total_out: number;
  total_returned: number;
  pending_qty: number;
  pending_count: number;
  movement_count: number;
};

/** `GET /v1/stock-gimmick/{id}/movements`. */
export type StockTrack = {
  summary: MovementSummary;
  movements: StockMovement[];
};

export type StockPage = {
  items: StockListItem[];
  meta: PageMeta;
};
