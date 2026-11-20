/** Pagination of the list answer. */
export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** One row of `GET /v1/product`, as the server sends it. */
export type ProductListItem = {
  id: number;
  product_code: string;
  sku_no: string | null;
  product_name: string;
  category_code: string;
  category_name: string | null;
  /** Absolute URL of the main picture, or null when the product has none. */
  image_url: string | null;
};

/** Price per customer tier, from the product's price list. All amounts are Rupiah. */
export type ProductPriceTiers = {
  tier_one: number;
  tier_two: number;
  tier_three: number;
  tier_four: number;
};

/** `GET /v1/product/{id}`. */
export type ProductDetail = ProductListItem & {
  group_code: string | null;
  specification: string | null;
  /** The base price of the product master. */
  price: number | null;
  /** Null while the product has no price list. */
  price_tiers: ProductPriceTiers | null;
  /** Every picture; empty when the product has none. */
  images: string[];
  created_at: string | null;
  updated_at: string | null;
};

/** One choice of the category filter, from `GET /v1/product/categories`. */
export type ProductCategory = {
  category_code: string;
  category_name: string;
};

export type ProductFilters = {
  /** A `category_code` from the categories list, or null for every category. */
  categoryCode: string | null;
};

export type ProductPage = {
  items: ProductListItem[];
  meta: PageMeta;
};
