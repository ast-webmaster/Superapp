import type { PickedFile } from '@/core/files';

/**
 * The two document groups of the backend: one brand (`marketing-activity`) or several brands
 * in one activity (`marketing-activity-combination`). Same shapes, different path.
 */
export type MarketingActivityKind = 'single' | 'combination';

/** Statuses the list endpoint accepts as a filter. */
export type MarketingActivityStatus =
  | 'AWAITING'
  | 'REVISE'
  | 'REJECTED'
  | 'CANCELED'
  | 'ONGOING'
  | 'AWAITING REALIZATION'
  | 'REALIZATION APPROVAL'
  | 'AWAITING CLAIM'
  | 'APPROVAL ADDITIONAL COST'
  | 'REVISE ADDITIONAL COST'
  | 'COMPLETED';

/** Everything the user can narrow the list by. `null` and an empty list mean no narrowing. */
export type MarketingActivityListFilters = {
  status: MarketingActivityStatus[];
  /** `last_updated_tier`: who holds the activity now. */
  tier: string[];
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

export type MarketingActivityBrand = {
  mkt_code: string;
  name: string;
};

/** One row of `GET /marketing-activity`. Field names follow the wire format. */
export type MarketingActivityListItem = {
  activity_uuid: string;
  activity_no: string;
  /** YYYY-MM-DD */
  activity_date: string;
  /** Not narrowed to `MarketingActivityStatus`: show values the app does not know as they are. */
  status: string;
  activity_type: string | null;
  activity_name: string;
  customer_name: string | null;
  brands: MarketingActivityBrand[];
  estimated_total_cost: number;
  real_total_cost: number;
  sign_of_applicant_name: string | null;
  last_updated_tier: string | null;
  last_updated_names: string[];
  /** The activity waits for the signed-in user. */
  awaiting_me: boolean;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** What the signed-in user may do on one activity. The server decides; the app only shows these. */
export type MarketingActivityAction =
  'approve' | 'reject' | 'revise' | 'finish_realization' | 'complete' | 'claim';

export type MarketingActivitySupport = {
  activity_support: string;
  qty: number;
  unit_price: number;
  total: number;
  remarks: string | null;
  covered_by: string | null;
  qty_realization: number | null;
  unit_price_realization: number | null;
  total_realization: number | null;
  remarks_realization: string | null;
};

export type MarketingActivityTarget = {
  indicator: string;
  estimate_value: number | null;
  realization_value: number | null;
};

/** Downloaded by `id` through the attachment endpoint; the server's `download_url` is not used. */
export type MarketingActivityAttachment = {
  id: number;
  file: string;
  description: string | null;
  type: string | null;
};

/** Sell-in of the three months before the activity, last month first. */
export type MarketingActivitySalesRevenue = {
  months: { label: string; value: number | null }[];
  total_sellin: number | null;
  average_three_month: number | null;
  average_last_year: number | null;
  note: string | null;
};

/** One credit note row Finance attached to the activity. Only ACTIVE rows count in the total. */
export type MarketingActivityFinanceRow = {
  id: number;
  status: string;
  inv_ar_no: string | null;
  cn_no: string | null;
  currency: string | null;
  /** In `currency`. */
  total_cn_usage: number;
  exchange_rate: number | null;
  /** In rupiah. */
  total_cn_final: number;
};

/** One tier's step in the approval log, oldest first. */
export type MarketingActivityStep = {
  tier: string;
  user_name: string | null;
  status: string;
  /** `YYYY-MM-DD HH:mm:ss`, null while the step has not acted. */
  action_at: string | null;
  remarks: string | null;
};

/** `GET /marketing-activity/{uuid}` and the response of an action. */
export type MarketingActivityDetail = MarketingActivityListItem & {
  /** ISO 8601. Sent back with an action so the server can refuse it if the activity changed since. */
  updated_at: string;
  allowed_actions: MarketingActivityAction[];
  category: string | null;
  category_name: string | null;
  activity_place: string | null;
  offices: string[];
  start_of_activity_period: string | null;
  end_of_activity_period: string | null;
  principle_support: number | null;
  principle_parkfund: number | null;
  astrindo_support: number | null;
  note_support: string | null;
  revision_total_cost: number;
  additional_total_cost: number;
  ratio_cost: string | null;
  ratio_cost_realization: string | null;
  tax: string | null;
  /** Who bears the tax (the web calls it Tax Insurer). */
  tax_payer: string | null;
  /** Length of the activity as text, such as "3 Days". */
  target_period: string | null;
  pr_no: string | null;
  reason_late: string | null;
  reason_late_remarks: string | null;
  activity_note: string | null;
  activity_note_realization: string | null;
  /** Email of the applicant. */
  sign_of_applicant: string | null;
  supports: MarketingActivitySupport[];
  targets: MarketingActivityTarget[];
  attachments: MarketingActivityAttachment[];
  last_sales_revenue: MarketingActivitySalesRevenue;
  finance_informations: MarketingActivityFinanceRow[];
  /** Sum of the ACTIVE rows, in rupiah. */
  finance_total: number;
  approvements: MarketingActivityStep[];
};

export type MarketingActivityActionInput = {
  action: MarketingActivityAction;
  remarks?: string;
  /** `updated_at` of the detail the user acted on. */
  updatedAt: string;
  /** The proof file of a `claim`; the server refuses a claim without it. */
  file?: PickedFile;
};
