import type { PickedFile } from '@/core/files';

/** Statuses the list endpoint accepts as a filter. */
export type OnDutyRequestStatus =
  | 'SUBMISSION'
  | 'AWAITING'
  | 'REVISE'
  | 'REJECTED'
  | 'CANCELED'
  | 'APPROVED'
  | 'DECLARATION'
  | 'AWAITING APPROVAL DECLARATION'
  | 'REVISE DECLARATION'
  | 'DONE';

/** The list screen can show one status or everything. */
export type OnDutyRequestFilter = OnDutyRequestStatus | 'all';

/** Everything the user can narrow the list by. `null` and `'all'` mean no narrowing. */
export type OnDutyRequestListFilters = {
  status: OnDutyRequestFilter;
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

/** Where the trip goes: cities (domestic) or countries (overseas). It sets the allowance rate. */
export type TripType = 'DOMESTIC' | 'OVERSEAS';

/** One row of `GET /on-duty-request`. Field names follow the wire format. */
export type OnDutyRequestListItem = {
  uuid: string;
  on_duty_no: string;
  /** YYYY-MM-DD */
  on_duty_date: string;
  /** Not narrowed to `OnDutyRequestStatus`: show values the app does not know as they are. */
  status: string;
  type: string | null;
  purpose: string | null;
  destinations_count: number;
  total: number;
  grand_total: number;
  /** Email of the requester. */
  requester: string;
  requester_name: string | null;
  last_updated_name: string | null;
  /** The document waits for the signed-in user. */
  awaiting_me: boolean;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** What the signed-in user may do on one document. The server decides; the app only shows these. */
export type OnDutyRequestAction = 'approve' | 'reject' | 'revise' | 'cancel';

export type BrandOption = {
  category_code: string;
  category_name: string | null;
};

export type SharingRow = BrandOption & {
  /** 1 to 100. */
  percentage: number;
};

export type OnDutyDestination = {
  uuid: string;
  type: string | null;
  destination: string | null;
  /** YYYY-MM-DD */
  start_date: string;
  end_date: string;
  days: number;
  employee_name: string | null;
  allowance_per_day: number | null;
  total_allowance: number;
};

/** How a cost is paid: PR becomes a purchase request, NO-PR is paid as realization. */
export type NeedPr = 'PR' | 'NO-PR' | 'VOUCHER';

export type OnDutyCost = {
  id: number;
  item_code: string;
  item_description: string | null;
  need_pr: string | null;
  currency: string | null;
  amount: number;
  /** Null until the declaration is sent. */
  amount_real: number | null;
  /** 'YES' or 'NO'. */
  sharing_costs: string | null;
  remarks: string | null;
  remarks_real: string | null;
  pr_no: string | null;
  /** Set once a receipt was uploaded with the declaration. */
  receipt_url: string | null;
};

export type OnDutyAttachment = {
  id: number;
  file: string;
  description: string | null;
};

/** One tier's step in an approval chain. */
export type OnDutyStep = {
  user_name: string | null;
  tier: string;
  status: string;
  action_at: string | null;
  remarks: string | null;
};

export type OnDutyDeclaration = {
  uuid: string;
  declaration_no: string | null;
  status: string;
  remarks: string | null;
  approvements: OnDutyStep[];
};

/** `GET /on-duty-request/{uuid}` and the response of an action, a create or a declaration. */
export type OnDutyRequestDetail = {
  uuid: string;
  on_duty_no: string;
  on_duty_date: string;
  status: string;
  /** ISO 8601. Sent back with an action so the server can refuse it if the document changed since. */
  updated_at: string;
  allowed_actions: OnDutyRequestAction[];
  /** The requester may fix a document that was sent back (status REVISE). */
  can_resubmit: boolean;
  /** The requester may send or fix the declaration. */
  can_declare: boolean;
  type: string | null;
  purpose: string | null;
  remarks: string | null;
  brands: BrandOption[];
  sharing: SharingRow[];
  total: number;
  total_allowance: number;
  grand_total: number;
  total_real: number | null;
  total_allowance_real: number | null;
  grand_total_real: number | null;
  requester: string;
  requester_name: string | null;
  last_updated_name: string | null;
  letter_of_assignment_url: string | null;
  destinations: OnDutyDestination[];
  costs: OnDutyCost[];
  attachments: OnDutyAttachment[];
  approvements: OnDutyStep[];
  declaration: OnDutyDeclaration | null;
};

export type OnDutyRequestActionInput = {
  action: OnDutyRequestAction;
  remarks?: string;
  /** `updated_at` of the detail the user acted on. */
  updatedAt: string;
};

/** One expense kind of `GET /on-duty-request/options`. */
export type CostItemOption = {
  item_code: string;
  item_description: string | null;
  need_pr: string | null;
};

/** `GET /on-duty-request/options`. A null rate means the account has no allowance set. */
export type OnDutyOptions = {
  brands: BrandOption[];
  items: CostItemOption[];
  pocket_money: { domestic: number | null; overseas: number | null };
};

export type DraftDestination = {
  /** Local id for list keys and editing. Never sent. */
  id: string;
  destination: string | null;
  /** YYYY-MM-DD */
  startDate: string | null;
  endDate: string | null;
};

/** Numbers are kept as the text the user typed, so a half-typed "1." survives a re-render. */
export type DraftCost = {
  id: string;
  item: CostItemOption | null;
  amount: string;
  sharing: boolean;
  remarks: string;
};

export type DraftAttachment = {
  id: string;
  description: string;
  file: PickedFile;
};

/** Everything the request form collects. Held in the screen, never in the query cache. */
export type OnDutyRequestDraft = {
  type: TripType | null;
  purpose: string;
  remarks: string;
  /** Required when creating; on a resubmit, empty keeps the letter already on the server. */
  letter: PickedFile | null;
  /** `category_code`s. */
  brands: string[];
  /** Percentage text by `category_code`. Only brands still selected are sent. */
  sharing: Record<string, string>;
  destinations: DraftDestination[];
  costs: DraftCost[];
  attachments: DraftAttachment[];
};

export type DeclarationCostDraft = {
  /** `costs[].id` of the detail this draft was made from. */
  id: number;
  label: string;
  estimate: number;
  amountReal: string;
  remarks: string;
  /** A newly chosen receipt. Null keeps the one on the server, when there is one. */
  receipt: PickedFile | null;
  hasStoredReceipt: boolean;
};

export type DeclarationDestinationDraft = {
  uuid: string;
  destination: string;
  originalStart: string;
  originalEnd: string;
  startDate: string;
  endDate: string;
};

export type DeclarationDraft = {
  costs: DeclarationCostDraft[];
  destinations: DeclarationDestinationDraft[];
  notes: string;
};
