import type { PickedFile } from '@/core/files';

/**
 * The two gimmick flows this module covers. They share one API shape (`v1/marketing-inbound` and
 * `v1/marketing-request`), so one code base serves both and `flow` picks the path, the keys and
 * the rules (see `flows.ts`).
 */
export type GimmickFlow = 'inbound' | 'request';

/**
 * Everything the user can narrow the list by. `status` is `'all'`, one status, or several joined
 * with commas (the API accepts that); a status the app does not know still goes through as is.
 */
export type GimmickListFilters = {
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

/** One row of `GET /marketing-<flow>`. Field names follow the wire format. */
export type GimmickListItem = {
  uuid: string;
  /** DO.{month}.{year}.{sequence} */
  do_no: string;
  /** YYYY-MM-DD */
  do_date: string;
  flow: string;
  /** Not narrowed to a union: show values the app does not know as they are. */
  status: string;
  /** Office names. */
  sender_name: string | null;
  receiver_name: string | null;
  /** Email of the creator. */
  requester: string;
  requester_name: string | null;
  total_items: number;
  total_qty: number;
  /** The document waits for the signed-in user. */
  awaiting_me: boolean;
};

/** The server decides which of these the user may do; the app only shows what it offers. */
export type GimmickAction = 'approve' | 'reject' | 'process' | 'receive' | 'cancel';

export type GimmickActionInput = {
  action: GimmickAction;
  remarks?: string;
  /** The `updated_at` of the detail the user looked at. */
  updatedAt: string;
};

export type GimmickAttachment = {
  /** `doc` is the file sent with the document. */
  slot: string;
  name: string;
  /** Absolute, and not used: the app downloads through its own client. */
  url: string;
};

export type GimmickItem = {
  id: number;
  code_item: string;
  name_item: string | null;
  qty: number;
};

/** One row of the approval log. A `pending` row is the action still awaited (`action_at` is null). */
export type GimmickStep = {
  name: string | null;
  role: string | null;
  status: string | null;
  remarks: string | null;
  action_at: string | null;
  pending: boolean;
};

/** `GET /marketing-<flow>/{uuid}`, and what every write answers with. */
export type GimmickDetail = GimmickListItem & {
  /** ISO 8601. Sent back with every action as the concurrency reference. */
  updated_at: string;
  allowed_actions: string[];
  remarks: string | null;
  /** What the approver wrote. */
  remarks_approve: string | null;
  attachments: GimmickAttachment[];
  items: GimmickItem[];
  /** Newest first. */
  approvements: GimmickStep[];
};

/** A destination office from `GET /marketing-request/options`. */
export type OfficeOption = {
  id: number;
  name: string;
};

/** A gimmick item from `GET /items`. */
export type ItemOption = {
  code_item: string;
  name_item: string | null;
  /** Stock that can still be used, or null when the flow adds stock (inbound). */
  available: number | null;
};

export type DraftItem = {
  /** A local id for lists and editing. Never sent to the server. */
  id: string;
  item: ItemOption | null;
  /** Digits only while typing. */
  qty: string;
};

export type GimmickDraft = {
  /** Destination of a request. Unused by inbound. */
  office: OfficeOption | null;
  remarks: string;
  doc: PickedFile | null;
  items: DraftItem[];
};
