import { clsx } from 'clsx';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils/format';

import { formatCoordinates } from '../create/draft';
import { useProofPhoto } from '../hooks/use-photo';
import type { SalesVisitationDetail, VisitationPhase } from '../types';
import { flagText, noteBadge, statusBadge } from './status';

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

/** A label with a longer text under it, for what does not fit beside its label. */
function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="caption">{value}</AppText>
    </View>
  );
}

/** The map page of a point. The phone offers its map app; there is no map inside this app. */
const mapUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

function MapLink({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <Pressable
      role="link"
      aria-label="Open this point in maps"
      onPress={() => void Linking.openURL(mapUrl(latitude, longitude))}
      className={clsx(
        'min-h-control flex-row items-center gap-3 rounded-lg bg-surface-gray px-3 py-2 active:bg-border',
        focusRing,
      )}>
      <Icon name="map" color="primary" />
      <View className="min-w-0 flex-1">
        <AppText variant="caption-strong" numberOfLines={1}>
          {formatCoordinates(latitude, longitude)}
        </AppText>
        <AppText variant="label" tone="muted">
          Open in maps
        </AppText>
      </View>
    </Pressable>
  );
}

export function SummarySection({ detail }: { detail: SalesVisitationDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.title}
        </AppText>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge size="sm" {...statusBadge(detail.status)} />
        {detail.has_flags ? (
          <Badge size="sm" tone="warning" icon="alert" label="GPS notes" />
        ) : null}
      </View>
    </Section>
  );
}

export function InfoSection({ detail }: { detail: SalesVisitationDetail }) {
  const rows: [string, string | null][] = [
    ['Customer', detail.customer_name],
    ['Registered', detail.customer_registered ? 'Yes' : 'No, free-text name'],
    ['Visit date', formatDate(detail.visitation_date)],
    ['Purpose', detail.purposes.map((purpose) => purpose.name).join(', ') || null],
    ['Brands', detail.categories.map((category) => category.category_name).join(', ') || null],
    ['Planned by', detail.created_by_name],
  ];

  return (
    <Section title="Detail">
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {detail.location_label ? <TextBlock label="Place" value={detail.location_label} /> : null}
      <MapLink latitude={detail.latitude} longitude={detail.longitude} />
    </Section>
  );
}

export function PlanSection({ detail }: { detail: SalesVisitationDetail }) {
  return (
    <Section title="Plan and result">
      <TextBlock label="Plan" value={detail.plan} />
      <TextBlock
        label="Result"
        value={detail.result?.trim() ? detail.result : 'Not written yet.'}
      />
    </Section>
  );
}

/** The proof photo of one side, fetched with the user's token. Only asked for once the screen shows it. */
function ProofPhoto({ uuid, type }: { uuid: string; type: 'in' | 'out' }) {
  const { data, isPending, isError, refetch } = useProofPhoto(uuid, type, true);

  return (
    <View className="aspect-4/3 items-center justify-center overflow-hidden rounded-lg bg-surface-gray">
      {data ? (
        <Image
          contentFit="cover"
          source={{ uri: data }}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={`Proof photo of the check-${type === 'in' ? 'in' : 'out'}`}
        />
      ) : isPending ? (
        <ActivityIndicator accessibilityLabel="Loading photo" color={colors.primary} />
      ) : isError ? (
        <Pressable
          role="button"
          aria-label="Try loading the photo again"
          onPress={() => void refetch()}
          className={clsx('items-center gap-1 p-4', focusRing)}>
          <Icon name="refresh" color="ink-muted" />
          <AppText variant="label" tone="muted">
            Could not load the photo. Tap to retry.
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function PhaseBody({
  uuid,
  type,
  phase,
}: {
  uuid: string;
  type: 'in' | 'out';
  phase: VisitationPhase;
}) {
  const hasPoint = phase.latitude !== null && phase.longitude !== null;
  return (
    <>
      <DetailRow label="Time" value={formatDateTime(phase.at)} />
      {phase.distance_m !== null ? (
        <DetailRow label="From the planned point" value={`${Math.round(phase.distance_m)} m`} />
      ) : null}
      {phase.accuracy_m !== null ? (
        <DetailRow label="GPS accuracy" value={`${Math.round(phase.accuracy_m)} m`} />
      ) : null}
      {hasPoint ? (
        <MapLink latitude={phase.latitude as number} longitude={phase.longitude as number} />
      ) : null}
      {phase.photo_url ? <ProofPhoto uuid={uuid} type={type} /> : null}
      {phase.flags.length > 0 ? (
        <View className="gap-1 rounded-lg bg-warning-bg p-3">
          {phase.flags.map((flag) => (
            <View key={flag} className="flex-row items-start gap-2">
              <Icon name="alert" size={14} color="warning" />
              <AppText variant="label" className="min-w-0 flex-1">
                {flagText(flag)}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

export function CheckInSection({ detail }: { detail: SalesVisitationDetail }) {
  if (!detail.check_in) return null;
  return (
    <Section title="Check-in">
      <PhaseBody uuid={detail.uuid} type="in" phase={detail.check_in} />
    </Section>
  );
}

export function CheckOutSection({ detail }: { detail: SalesVisitationDetail }) {
  const phase = detail.check_out;
  if (!phase) return null;
  return (
    <Section title="Check-out">
      {phase.note ? (
        <View className="flex-row">
          <Badge size="sm" {...noteBadge(phase.note)} />
        </View>
      ) : null}
      {phase.onsite_minutes !== null ? (
        <DetailRow label="Time on site" value={`${phase.onsite_minutes} min`} />
      ) : null}
      <PhaseBody uuid={detail.uuid} type="out" phase={phase} />
    </Section>
  );
}
