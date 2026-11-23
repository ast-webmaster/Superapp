// Wire types of `v1/sales-inventory-analysis`. Field names follow the server. Statuses stay
// `string`: the backend adds them without warning, and an unknown one shows as it was sent.

export type Month = { key: string; label: string };

export type MohStatusInfo = { key: string; label: string; action: string };

export type AnalysisFilters = {
  branches: string[];
  brands: string[];
  inventory_months: Month[];
  statuses: MohStatusInfo[];
  moh: { run_rate_months: number; need_order_below: number; normal_until: number };
  /** `bulan` or `hari`. */
  dealer_idle_unit: string;
  today: string;
};

/** The branches and brands the user narrowed the analysis to. Empty means everything in scope. */
export type AnalysisSelection = { branch: string[]; brand: string[] };

export type InventoryRow = {
  group: string;
  stock_available: number;
  /** Quantity sold per month, keyed by `Month.key`. */
  sales: Record<string, number>;
  total_sales: number;
  avg_run_rate: number;
  /** Months on hand: `null` when nothing was sold. */
  moh: number | null;
  status: string;
  status_label: string;
  action: string;
};

export type Inventory = {
  periode: { bulan: Month[]; start: string; end: string; months: number };
  rows: InventoryRow[];
  /** Number of groups per status key. */
  summary: Record<string, number>;
  meta: {
    last_posting_date: string | null;
    last_stock_updated_at: string | null;
    scope: string;
  };
};

export type InactiveDealerItem = {
  group: string;
  batas_label: string;
  cutoff: string;
  last_posting_date: string;
  hari_tanpa_transaksi: number;
  jumlah_transaksi: number;
};

export type InactiveDealer = {
  branch: string;
  customer_code: string;
  customer_name: string;
  customer_group: string | null;
  customer_city: string | null;
  items: InactiveDealerItem[];
  item_count: number;
  max_hari_tanpa_transaksi: number;
};

export type InactiveBranch = {
  branch: string;
  dealer_count: number;
  dealers: InactiveDealer[];
};

export type InactiveDealers = {
  acuan: { tanggal: string; satuan: string };
  groups: { group: string; batas: number; batas_label: string; cutoff: string }[];
  branches: InactiveBranch[];
  summary: { branches: number; dealers: number; items: number };
  meta: { last_posting_date: string | null; scope: string };
};

export type ActivityPeriod = { label: string; start: string; end: string };

export type ActivityComparison = {
  current: ActivityPeriod;
  previous: ActivityPeriod;
  active: {
    current: number;
    previous: number;
    change: number;
    /** Percent, `null` when the previous period had no active dealer. */
    growth: number | null;
  };
  new: number;
  repeat: number;
  lost: number;
};

export type ActivityTrendMonth = {
  key: string;
  label: string;
  active_dealers: number;
  sales: number;
  sales_per_dealer: number | null;
};

export type DealerActivity = {
  acuan: { tanggal: string };
  mom: ActivityComparison;
  qoq: ActivityComparison;
  trend: ActivityTrendMonth[];
  meta: { last_posting_date: string | null; scope: string; trend_months: number };
};

export type AchievementGroup = {
  group_id: string;
  group_name: string;
  target: number;
  achievement: number;
  /** `null` when the group has no target. */
  achievement_percentage: number | null;
  linearity_percentage: number;
  gap_percentage: number | null;
  status: string;
};

export type Achievement = {
  acuan: { tanggal: string; periode: string };
  linearity_percentage: number;
  groups: AchievementGroup[];
  summary: {
    target: number;
    achievement: number;
    achievement_percentage: number | null;
    linearity_percentage: number;
    gap_percentage: number | null;
    status: string;
  };
  meta: { last_posting_date: string | null; scope: string; has_target: boolean };
};
