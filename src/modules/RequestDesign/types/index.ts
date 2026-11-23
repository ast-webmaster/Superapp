import type { PickedFile } from '@/core/files';

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/**
 * Everything the user can narrow the list by. `status` and `priority` are `'all'`, one value, or
 * several joined with commas (the API accepts that); a value the app does not know still goes
 * through as is.
 */
export type RequestDesignListFilters = {
  status: string;
  priority: string;
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

export type Brand = {
  category_code: string;
  category_name: string;
};

/** One row of `GET /request-design`. Field names follow the wire format. */
export type RequestDesignListItem = {
  uuid: string;
  /** RGD-{month}-{year}-{sequence} */
  request_design_no: string;
  /** YYYY-MM-DD */
  request_design_date: string;
  /** YYYY-MM-DD */
  due_date: string;
  /** Not narrowed to a union: show values the app does not know as they are. */
  status: string;
  priority: string;
  /** Only brands that still exist in the master. */
  brands: Brand[];
  total_items: number;
  total_qty: number;
  /** Email of the creator. */
  requester: string;
  requester_name: string | null;
  picked_by: string | null;
  picked_by_name: string | null;
  /** The document waits for the signed-in user. */
  awaiting_me: boolean;
};

/**
 * What `allowed_actions` can hold. `submit_file` and `edit` have their own endpoints; the rest go
 * through `POST /{uuid}/actions`. The server decides which the user may do.
 */
export type RequestDesignAction =
  | 'pick'
  | 'request_due_date'
  | 'approve_due_date'
  | 'reject_due_date'
  | 'approve'
  | 'assign'
  | 'set_priority'
  | 'set_points'
  | 'cancel';

export type DetailAction = RequestDesignAction | 'submit_file' | 'edit';

export type PointInput = { categoryUuid: string; qty: number };

export type RequestDesignActionInput = {
  action: RequestDesignAction;
  /** The `updated_at` of the detail the user looked at. */
  updatedAt: string;
  remarks?: string;
  /** `request_due_date`, YYYY-MM-DD. */
  dueDate?: string;
  /** `assign`, a designer's email. */
  assignTo?: string;
  /** `set_priority`. */
  priority?: 'HIGH' | 'MEDIUM';
  /** `set_points`: replaces the whole breakdown. */
  points?: PointInput[];
};

export type ResultInput = {
  updatedAt: string;
} & ({ fileType: 'LINK'; fileLink: string } | { fileType: 'FILE'; file: PickedFile });

export type Reference = {
  /** 1 to 3. */
  slot: number;
  name: string;
  /** Absolute, and not used: the app downloads through its own client. */
  download_url: string;
};

export type DetailItem = {
  id: number;
  type: string;
  qty: number;
  purpose: string | null;
  media: string | null;
  width: number | null;
  length: number | null;
  durasi: string | null;
  remarks: string | null;
  references: Reference[];
};

/** The designer's work: a link to open, or a file to download. Null until it is sent. */
export type DesignResult =
  { type: 'LINK'; url: string } | { type: 'FILE'; name: string; download_url: string };

export type PointCategoryLine = {
  uuid: string;
  name: string;
  qty: number;
  point: number;
  amount: number;
};

/** Only for designers and approvers; null for everyone else. */
export type Points = {
  total: number;
  categories: PointCategoryLine[];
};

/** One row of the approval log. A `pending` row is the action still awaited (`action_at` is null). */
export type RequestDesignStep = {
  name: string | null;
  role: string | null;
  status: string | null;
  remarks: string | null;
  /** Already formatted for display ("19 November 2026 09:15"), not ISO. */
  action_at: string | null;
  pending: boolean;
};

/** `GET /request-design/{uuid}`, and what every write answers with. */
export type RequestDesignDetail = RequestDesignListItem & {
  /** ISO 8601. Sent back with every write as the concurrency reference. */
  updated_at: string;
  allowed_actions: string[];
  description: string;
  theme_concept: string;
  picked_at: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  submit_date: string | null;
  /** The designer's proposed due date, only while the status is REQUEST DUE DATE. */
  requested_due_date: string | null;
  result: DesignResult | null;
  items: DetailItem[];
  points: Points | null;
  /** Newest first. */
  approvements: RequestDesignStep[];
};

export type DesignerOption = { email: string; name: string };

export type PointCategoryOption = { uuid: string; name: string; point: number };

/** `GET /request-design/options`. */
export type RequestDesignOptions = {
  brands: Brand[];
  item_types: string[];
  purposes: string[];
  media: string[];
  file_types: string[];
  designers: DesignerOption[];
  point_categories: PointCategoryOption[];
};

export type DraftItem = {
  /** A local id for lists and editing. Never sent to the server. */
  id: string;
  /** The server's item id when the document is being edited; null for a new item. */
  serverId: number | null;
  type: string | null;
  /** Digits only while typing. */
  qty: string;
  purpose: string | null;
  media: string | null;
  width: string;
  length: string;
  durasi: string;
  remarks: string;
  /** File names the server already holds for slots 1 to 3. They stay unless a file replaces them. */
  kept: readonly [string | null, string | null, string | null];
  /** Files chosen on this device for slots 1 to 3. */
  files: readonly [PickedFile | null, PickedFile | null, PickedFile | null];
};

export type RequestDesignDraft = {
  /** YYYY-MM-DD */
  dueDate: string | null;
  /** `category_code`s. */
  brands: string[];
  description: string;
  themeConcept: string;
  items: DraftItem[];
};

/** One designer's completed work in the month, against the monthly target. */
export type AnalyticsDesigner = {
  name: string;
  email: string;
  /** Points: quantity times the point of its category, summed. */
  count: number;
  target: number;
  /** Days the target covers, from the module's configuration. */
  days: number;
  /** Percent of the target reached. May pass 100. */
  target_achieved: number;
};

export type AnalyticsSeries = {
  name: string;
  email: string;
  /** Points per month, aligned with `trend.months`. */
  data: number[];
};

/** `GET /request-design/analytics`. */
export type RequestDesignAnalytics = {
  month: number;
  year: number;
  /** Empty when no request was completed in the month. */
  designers: AnalyticsDesigner[];
  trend: {
    /** Named by the server, such as "November 2026"; the last one is the chosen month. */
    months: string[];
    series: AnalyticsSeries[];
  };
};

export type AnalyticsPeriod = { month: number; year: number };
