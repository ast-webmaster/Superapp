import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText, Badge, ProductImage } from '@/shared/ui';
import { formatDateTime, formatMoney } from '@/shared/utils/format';

import type { ProductDetail, ProductPriceTiers } from '../types';

const divider = <View role="separator" className="h-px bg-border" />;

/** One card of the detail screen. The screen spaces the cards with `gap-4`. */
function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      {title ? (
        <AppText variant="caption-strong" role="heading">
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

/** One label and value on a line, the value right-aligned. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <AppText variant="label" tone="muted" className="shrink-0">
        {label}
      </AppText>
      <AppText variant="caption" className="min-w-0 flex-1 text-right">
        {value}
      </AppText>
    </View>
  );
}

/** The detail's pictures; the main one alone when the server lists no others. */
function pictures(detail: ProductDetail): string[] {
  if (detail.images.length > 0) return detail.images;
  return detail.image_url ? [detail.image_url] : [];
}

export function GallerySection({ detail }: { detail: ProductDetail }) {
  const uris = pictures(detail);

  if (uris.length === 0) return <ProductImage uri={null} className="h-48 w-full rounded-xl" />;

  return (
    // The cards use `px-5`; the pictures scroll edge to edge, so the list cancels it and re-adds it inside.
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5 grow-0"
      contentContainerClassName="gap-4 px-5">
      {uris.map((uri) => (
        <ProductImage key={uri} uri={uri} className="size-64 rounded-xl" />
      ))}
    </ScrollView>
  );
}

export function SummarySection({ detail }: { detail: ProductDetail }) {
  return (
    <Section>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          {detail.product_code}
        </AppText>
        <AppText variant="caption-strong" role="heading">
          {detail.product_name}
        </AppText>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge size="sm" label={detail.category_name ?? detail.category_code} />
      </View>
    </Section>
  );
}

const TIERS: [string, keyof ProductPriceTiers][] = [
  ['Tier 1', 'tier_one'],
  ['Tier 2', 'tier_two'],
  ['Tier 3', 'tier_three'],
  ['Tier 4', 'tier_four'],
];

/** Hidden when the product has neither a base price nor a price list. */
export function PriceSection({ detail }: { detail: ProductDetail }) {
  const { price, price_tiers: tiers } = detail;
  if (price === null && tiers === null) return null;

  return (
    <Section title="Price">
      {price !== null ? <DetailRow label="Base price" value={formatMoney(price)} /> : null}
      {price !== null && tiers ? divider : null}
      {tiers
        ? TIERS.map(([label, key]) => (
            <DetailRow key={key} label={label} value={formatMoney(tiers[key])} />
          ))
        : null}
    </Section>
  );
}

export function InfoSection({ detail }: { detail: ProductDetail }) {
  const rows: [string, string | null][] = [
    ['Product code', detail.product_code],
    ['SKU', detail.sku_no],
    ['Category', detail.category_name ?? detail.category_code],
    ['Group', detail.group_code],
    ['Updated', detail.updated_at ? formatDateTime(detail.updated_at) : null],
  ];

  return (
    <Section title="Details">
      {rows.map(([label, value]) => (
        <DetailRow key={label} label={label} value={value ?? '-'} />
      ))}
    </Section>
  );
}

/** Hidden when the product has no specification. */
export function SpecificationSection({ detail }: { detail: ProductDetail }) {
  if (!detail.specification) return null;

  return (
    <Section title="Specification">
      <AppText variant="caption">{detail.specification}</AppText>
    </Section>
  );
}
