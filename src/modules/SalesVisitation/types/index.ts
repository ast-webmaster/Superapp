import type { PickedFile } from '@/core/files';

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** What the list narrows by. `status` is `'all'`, one value, or several joined with commas. */
export type SalesVisitationListFilters = {
  status: string;
  /** YYYY-MM-DD, both set or both null. */
  dateFrom: string | null;
  dateTo: string | null;
};

export type Purpose = { id: number; name: string };

export type Category = { category_code: string; category_name: string };

/** The panel rules the server judges check-in and check-out by. Shown to the user, never applied by the app. */
export type VisitationSettings = {
  require_gps_radius: boolean;
  radius_meters: number;
  min_onsite_minutes: number;
};

/** `GET /sales-visitation/options`. */
export type SalesVisitationOptions = {
  purposes: Purpose[];
  categories: Category[];
  settings: VisitationSettings;
};

/** One row of `GET /sales-visitation`. Field names follow the wire format. */
export type SalesVisitationListItem = {
  uuid: string;
  title: string;
  /** Not narrowed to a union: show values the app does not know as they are. */
  status: string;
  /** YYYY-MM-DD */
  visitation_date: string;
  customer_id: string | null;
  /** The registered company's name, or the free text for an unregistered customer. */
  customer_name: string | null;
  customer_registered: boolean;
  purposes: Purpose[];
  categories: Category[];
  has_flags: boolean;
  created_by: string;
  created_by_name: string | null;
};

/** What the detail offers the signed-in user. Only the creator gets any. */
export type DetailAction = 'update' | 'delete' | 'check_in' | 'check_out';

/** One side of the visit: where and when the sales person arrived or left. */
export type VisitationPhase = {
  /** YYYY-MM-DD HH:mm:ss */
  at: string;
  latitude: number | null;
  longitude: number | null;
  /** Meters from the planned point, computed by the server. */
  distance_m: number | null;
  accuracy_m: number | null;
  photo_source: string | null;
  /** Needs the Authorization header: download through the api, never open it directly. */
  photo_url: string | null;
  flags: string[];
};

export type CheckOutPhase = VisitationPhase & {
  /** NOT COUNTED VISITATION, FORGOT VISITATION, EARLY CHECKOUT or VISITATION COMPLETED. */
  note: string | null;
  onsite_minutes: number | null;
};

/** `GET /sales-visitation/{uuid}`. */
export type SalesVisitationDetail = SalesVisitationListItem & {
  latitude: number;
  longitude: number;
  location_label: string | null;
  plan: string;
  result: string | null;
  allowed_actions: DetailAction[];
  check_in: VisitationPhase | null;
  check_out: CheckOutPhase | null;
  created_at: string | null;
  updated_at: string | null;
};

/** `POST /{uuid}/check-out/preview`: what the server would record, nothing is saved. */
export type CheckOutPreview = {
  distance_m: number | null;
  within_radius: boolean;
  onsite_minutes: number;
  note: string;
  require_gps_radius: boolean;
  radius_meters: number;
};

export type CustomerChoice = { customer_id: string; customer_name: string };

/** A point the form can use as the visit's location. */
export type LocationPoint = {
  latitude: number;
  longitude: number;
  label: string;
};

/** `GET /customer-locations`: places this customer was visited at, and its registered addresses. */
export type CustomerLocations = {
  previous_visits: { label: string | null; latitude: number; longitude: number }[];
  addresses: { uuid: string; address: string }[];
};

/** One hit of `GET /geocode`. */
export type GeocodeHit = { label: string; lat: number; lng: number };

/** What the form holds. Numbers stay as text while the user types. */
export type SalesVisitationDraft = {
  /** True: free-text customer. False: pick a registered one. */
  unregistered: boolean;
  customer: CustomerChoice | null;
  customerName: string;
  title: string;
  /** YYYY-MM-DD */
  date: string | null;
  location: LocationPoint | null;
  purposeIds: number[];
  categoryCodes: string[];
  plan: string;
  result: string;
};

/** One reading of the device's position, with the proof the server wants beside it. */
export type GpsFix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  /** ms epoch of the reading, from the device clock. */
  positionTimestamp: number;
  /** Device clock when the request is sent, so the age of the reading is not judged by the server's clock. */
  clientNow: number;
  isMock: boolean;
};

/** The proof photo, always taken with the camera. */
export type ProofPhoto = PickedFile;

export type CheckInput = {
  /** Null when the device could not locate itself: the server decides whether that is allowed. */
  fix: GpsFix | null;
  photo: ProofPhoto;
};
