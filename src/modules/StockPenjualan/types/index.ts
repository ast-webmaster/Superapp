/** Pagination of every list answer, plus what the stock endpoint adds to it. */
export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/**
 * Which shape the rows have. The server picks it from the user's permission: `sales` for
 * `read_stock_esales`, `all` for `read_all_stock_esales` alone. The app never decides it.
 */
export type StockView = 'sales' | 'all';

export type StockMeta = PageMeta & {
  view: StockView;
  /** ISO 8601 of the last stock import, or null when there is none yet. */
  last_updated_at: string | null;
};

/** One row of the `sales` view, as the server sends it. */
export type StockSalesRow = {
  product_code: string;
  product_name: string;
  category_code: string;
  price: number | null;
  /** Null from 100 up: the server hides the exact figure from sales. */
  stock_hq: number | null;
  stock_hq_over_100: boolean;
  /** Null while the account has no office. */
  stock_office: number | null;
  /** Only filled for holders of `read_stock_esales_dusit`. */
  stock_dusit: number | null;
  stock_in_transit: number | null;
  on_order_soon: boolean;
};

/** One row of the `all` view, as the server sends it. `offices` is keyed by office short name. */
export type StockAllRow = {
  product_code: string;
  product_name: string;
  category_code: string;
  offices: Record<string, number>;
  total: number;
};

/** A row tagged with its view, so a screen can tell the two shapes apart without casting. */
export type StockSalesItem = StockSalesRow & { kind: 'sales' };
export type StockAllItem = StockAllRow & { kind: 'all' };
export type StockItem = StockSalesItem | StockAllItem;

export type StockCategory = {
  category_code: string;
  category_name: string;
  brand_code: string | null;
  brand_name: string | null;
};

/** What the `all` view counts. Ignored by the server in the `sales` view. */
export type StockType =
  'AVAILABLE' | 'ON HAND' | 'ON ORDER' | 'TRANSFER OUTSTANDING' | 'SALES OUTSTANDING';

export type StockFilters = {
  /** A `category_code` from the categories list, or null for every category. */
  categoryCode: string | null;
  type: StockType;
};

export type StockPage = {
  items: StockItem[];
  meta: StockMeta;
};
