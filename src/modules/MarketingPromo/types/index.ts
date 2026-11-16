/**
 * The two document groups of the backend: one brand (`marketing-promo`) or several brands in
 * one promo (`marketing-promo-combination`). Same shapes, different path.
 */
export type MarketingPromoKind = 'single' | 'combination';

/** Statuses the list endpoint accepts as a filter. */
export type MarketingPromoStatus =
  | 'AWAITING'
  | 'REVISE'
  | 'REJECTED'
  | 'CANCELED'
  | 'APPROVED'
  | 'ONGOING'
  | 'AWAITING RECAP'
  | 'AWAITING APPROVAL RECAP'
  | 'REVISE RECAP'
  | 'AWAITING APPROVAL REVISE'
  | 'AWAITING REALIZATION'
  | 'REALIZATION APPROVAL'
  | 'APPROVAL ADDITIONAL COST'
  | 'REVISE ADDITIONAL COST'
  | 'COMPLETED';

/** Everything the user can narrow the list by. `null` and an empty list mean no narrowing. */
export type MarketingPromoListFilters = {
  status: MarketingPromoStatus[];
  /** `last_updated_tier`: who holds the promo now. */
  tier: string[];
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

export type MarketingPromoBrand = {
  mkt_code: string | null;
  name: string | null;
};

/** One row of `GET /marketing-promo`. Field names follow the wire format. */
export type MarketingPromoListItem = {
  uuid: string;
  promo_no: string;
  /** YYYY-MM-DD */
  promo_date: string | null;
  promo_name: string;
  category: string | null;
  /** Not narrowed to `MarketingPromoStatus`: show values the app does not know as they are. */
  status: string;
  /** `ACHIEVED` or `NOT ACHIEVED` once the recap is in. */
  recap_status: string | null;
  brands: MarketingPromoBrand[];
  customer_name: string | null;
  start_of_promo_period: string | null;
  end_of_promo_period: string | null;
  estimated_total_cost: number | null;
  last_updated_tier: string | null;
  last_updated_names: string[];
  /** Email of the applicant. */
  requester: string | null;
  requester_name: string | null;
  /** The promo waits for the signed-in user. */
  awaiting_me: boolean;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** What the signed-in user may do on one promo. The server decides; the app only shows these. */
export type MarketingPromoAction = 'approve' | 'reject' | 'revise' | 'cancel';

export type MarketingPromoCost = {
  id: number;
  promo_support: string;
  covered_by: string | null;
  qty: number | null;
  unit_price: number | null;
  total: number | null;
  remarks: string | null;
  qty_realization: number | null;
  unit_price_realization: number | null;
  total_realization: number | null;
  remarks_realization: string | null;
};

/** Downloaded by `id` through the attachment endpoint; the server's `download_url` is not used. */
export type MarketingPromoAttachment = {
  id: number;
  file: string;
  description: string | null;
};

/** One tier's step in the approval log, oldest first. */
export type MarketingPromoStep = {
  tier: string;
  user_email: string | null;
  user_name: string | null;
  status: string;
  remarks: string | null;
  /** ISO 8601, null while the step has not acted. */
  action_at: string | null;
};

/** `GET /marketing-promo/{uuid}` and the response of an action. */
export type MarketingPromoDetail = MarketingPromoListItem & {
  /** ISO 8601. Sent back with an action so the server can refuse it if the promo changed since. */
  updated_at: string;
  allowed_actions: MarketingPromoAction[];
  category_name: string | null;
  promo_type: string | null;
  promo_type_name: string | null;
  offices: string[];
  gift: string | null;
  promo_note: string | null;
  /** File name of the promo mechanism document, downloaded through its own endpoint. */
  mechanism: string | null;
  reason_late: string | null;
  reason_late_remarks: string | null;
  target: number | null;
  target_realization: number | null;
  real_total_cost: number | null;
  additional_total_cost: number | null;
  ratio_cost: string | null;
  ratio_cost_realization: string | null;
  /** Percent shares of the cost. */
  principle_support: number | null;
  principle_parkfund: number | null;
  astrindo_support: number | null;
  note_support: string | null;
  recap_note: string | null;
  costs: MarketingPromoCost[];
  attachments: MarketingPromoAttachment[];
  approvements: MarketingPromoStep[];
};

export type MarketingPromoActionInput = {
  action: MarketingPromoAction;
  remarks?: string;
  /** `updated_at` of the detail the user acted on. */
  updatedAt: string;
};
