# Price approval create: backend handoff (unit tests and API docs)

For the session working in `Laragon/digitalapproval` (`Modules/PriceApproval`). The mobile app's multi-step create form is built and calls the endpoints below. This file lists what the app relies on, one gap to close, and what to test and document.

## What the app sends

`POST /api/v1/price-approval`, always `multipart/form-data` (one code path, with or without files). Items use bracket notation.

| Field | Notes |
|---|---|
| `customer_id`, `po_sc` (`PO`/`SC`), `payment_type` (`TOP`/`CASH`), `category` (`PKP`/`NON-PKP`), `shipment` (`DS`/`NON-DS`), `shipping_note` | All required |
| `order_date` | `YYYY-MM-DD`, sent **only** when `po_sc=PO` |
| `remarks` | Sent only when not empty |
| `items[i][sku_no]`, `[qty]`, `[unit_price]`, `[discount_option]` (1/2/3), `[cash_discount]` | Always |
| `items[i][discount_percentage]` / `[discount_nominal]` | Only for option 2 / 3 |
| `items[i][product_manager]` | Only when the product's category has no PM (`products` answered `pm: null`) |
| `items[i][remark]` | Only when not empty |
| `attachments[]`, `attachment_descriptions[]` | Optional, same order, max 10 files of 5 MB |

The app never sends totals, `pa_no` or `status`. It shows a preview total from the same formula as `PriceApprovalLineCalculator`; the server's figure is the one stored.

The app reads `GET /price-approval/customers?search=` and `GET /price-approval/products?search=` (already implemented) and on success opens the detail with the `201` body, so the response must keep the `GET /{uuid}` shape.

## Gap to close: product manager lookup

When a product's category has no PM, the form makes the user choose one, and it calls:

```
GET /api/v1/price-approval/product-managers?search=
-> { success, message, data: [{ email: string, name: string|null }], meta: null }
```

Not implemented yet. Requirements: permission `create_priceapproval`, at most 50 rows, `search` matches name or email, only emails that pass `Rule::exists('category', 'pm')` in `CreatePriceApprovalRequest` (so a listed PM is always accepted). Until it exists, a product with a PM-less category cannot be submitted from the app; the picker shows an error with "Try again".

Also confirm: does `products` `price` arrive as a decimal string? The app accepts a number or a string.

## Unit and feature tests to add or check

Existing: `PriceApprovalApiCreateTest.php`. Check it covers, and add what is missing:

1. `PriceApprovalLineCalculator` unit tests. The app mirrors these cases (see `src/modules/PriceApproval/create/draft.test.ts`): no discount (1110 x 2 = 2220); 10% on 1110 incl. VAT gives price after discount 999; nominal 110 off with 10% cash discount, qty 2 gives 1800.
2. `product-managers`: permission (403 without `create_priceapproval`), search, limit 50, only valid PMs.
3. `POST` multipart without JSON content type: items in bracket notation, `order_date` absent for SC, ignored if sent for SC.
4. PM-less category: 422 on `items.N.product_manager` when missing; accepted when given; ignored when the category has a PM.
5. Attachments: description missing gives 422 on `attachment_descriptions.N`; 11 files gives 422; a file over 5 MB gives 422; all-or-nothing (no row, no file left after a failure).
6. Customer outside the user's branch gives 422.
7. `cash_discount` over 100 and `discount_nominal >= unit_price` give 422.

## API documentation to update

Update `docs/api/price-approval-api-guide.md` (step 7) for: the `product-managers` endpoint; the always-multipart request the app sends; the 422 `errors` key shapes the app surfaces (`items.0.qty`, `attachment_descriptions.0`); and the 60 s client timeout for uploads. Keep the "never `200 {result:false}`" rule from `docs/data-management.md` in the Superapp repo.

## Search load (customers and products have thousands of rows)

The app debounces 400 ms, sends nothing for text under 2 characters, cancels the request for older text, and keeps the previous rows while the next search loads. Server side, `customers` and `products` use `LIKE %text%`, which cannot use a normal index. Please check the query plan on production-sized data and consider a FULLTEXT or prefix index on `customer.customer_name`, `product.product_name`, `product.product_code`, `product.sku_no`, and a server-side minimum of 2 characters (answer 422 or an empty list below it). Keep the 50-row limit: the app shows "Showing the first 50" when it hits it.
