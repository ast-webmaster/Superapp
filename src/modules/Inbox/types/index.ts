/** One row of `GET /notifications`: a document waiting for the signed-in user. Field names follow the wire format. */
export type InboxItem = {
  id: string;
  /** Manifest id of the module the document belongs to, e.g. "price-approval". */
  module: string;
  /** Null for an old row that never stored its document. */
  doc_uuid: string | null;
  /** Not narrowed to a union: show values the app does not know as they are. */
  status: string;
  tier: string | null;
  /** Null when the document no longer exists. */
  title: string | null;
  subtitle: string | null;
  /** ISO 8601 with offset. */
  created_at: string | null;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};
