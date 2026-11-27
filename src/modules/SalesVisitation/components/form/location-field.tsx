import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { AppText, Button, Loading, Sheet, TextField, OptionRow } from '@/shared/ui';

import { readPosition } from '../../capture/gps';
import { formatCoordinates, parseCoordinates } from '../../create/draft';
import {
  GEOCODE_MIN_CHARS,
  useCustomerLocations,
  useGeocode,
  useMapLink,
} from '../../hooks/use-lookups';
import type { LocationPoint } from '../../types';
import { PickerField } from './picker-field';

export interface LocationFieldProps {
  value: LocationPoint | null;
  onChange: (point: LocationPoint) => void;
  /** The registered customer chosen above, to offer its earlier visit points and addresses. */
  customerId: string | null;
  error?: string;
}

const describe = (point: LocationPoint) =>
  point.label.trim() || formatCoordinates(point.latitude, point.longitude);

/** A pasted Google Maps link, with or without the scheme. Anything else is searched as an address. */
const looksLikeLink = (text: string) =>
  /^https?:\/\//i.test(text) ||
  /^(www\.)?(google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(text);

/**
 * Where the visit takes place, chosen in one box like the web form: type a building, place or
 * address and search, or paste a Google Maps link or "lat, lng". The box decides which it is.
 * Besides it: this device's position and, for a registered customer, a point it was visited at
 * before or one of its registered addresses. The server later measures check-in and check-out
 * against this point. There is no map inside the app: the point is shown as text.
 */
export function LocationField({ value, onChange, customerId, error }: LocationFieldProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [searched, setSearched] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const suggestions = useCustomerLocations(open ? customerId : null);
  const geocode = useGeocode(open ? searched : null);
  const mapLink = useMapLink();

  const pick = (point: LocationPoint) => {
    onChange(point);
    setOpen(false);
  };

  /** One entry point for the box: coordinates and links are read, everything else is searched. */
  const submit = (raw: string) => {
    const input = raw.trim();
    setMessage(null);
    setText(input);
    if (!input) return;

    // Plain coordinates need no round trip.
    const plain = parseCoordinates(input);
    if (plain) {
      pick({ ...plain, label: 'Pinned location' });
      return;
    }
    if (looksLikeLink(input)) {
      setSearched(null);
      mapLink.mutate(/^https?:\/\//i.test(input) ? input : `https://${input}`, {
        onSuccess: ({ lat, lng }) =>
          pick({ latitude: lat, longitude: lng, label: 'Pinned location' }),
        onError: (failure) => setMessage(toAppError(failure).message),
      });
      return;
    }
    if (input.length < GEOCODE_MIN_CHARS) {
      setMessage(`Type at least ${GEOCODE_MIN_CHARS} characters, or paste a Google Maps link.`);
      return;
    }
    setSearched(input);
  };

  const locateMe = async () => {
    setMessage(null);
    setLocating(true);
    try {
      const fix = await readPosition();
      pick({ latitude: fix.latitude, longitude: fix.longitude, label: 'Current location' });
    } catch (failure) {
      setMessage(toAppError(failure).message);
    } finally {
      setLocating(false);
    }
  };

  const previous = suggestions.data?.previous_visits ?? [];
  const addresses = suggestions.data?.addresses ?? [];
  const busy = mapLink.isPending || geocode.isFetching;

  return (
    <>
      <PickerField
        label="Visit location"
        required
        value={value ? describe(value) : null}
        placeholder="Choose where you will visit"
        onPress={() => setOpen(true)}
        help={
          value && value.label.trim()
            ? formatCoordinates(value.latitude, value.longitude)
            : undefined
        }
        error={error}
      />
      <Sheet visible={open} fullHeight title="Visit location" onClose={() => setOpen(false)}>
        <TextField
          icon="search"
          variant="search"
          label="Building, place, address or map link"
          placeholder="Search, or paste a Google Maps link or coordinates"
          value={text}
          onChangeText={setText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => submit(text)}
          help="A link with only a place name has no coordinates. Pick the point in Google Maps first."
          trailing={
            <Button size="sm" variant="soft" loading={busy} onPress={() => submit(text)}>
              Search
            </Button>
          }
        />
        {message ? (
          <AppText variant="caption" tone="danger" aria-live="polite">
            {message}
          </AppText>
        ) : null}

        {geocode.isFetching ? (
          <Loading label="Searching the address" />
        ) : geocode.error ? (
          <AppText variant="caption" tone="danger">
            {toAppError(geocode.error).message}
          </AppText>
        ) : geocode.data ? (
          geocode.data.length > 0 ? (
            <View className="gap-2">
              {geocode.data.map((hit) => (
                <OptionRow
                  key={`${hit.lat},${hit.lng},${hit.label}`}
                  icon="search"
                  aria-label={hit.label}
                  label={hit.label}
                  caption={formatCoordinates(hit.lat, hit.lng)}
                  onPress={() => pick({ latitude: hit.lat, longitude: hit.lng, label: hit.label })}
                />
              ))}
            </View>
          ) : (
            <AppText variant="caption" tone="muted">
              No place found. Try fewer words, or paste a Google Maps link.
            </AppText>
          )
        ) : null}

        <Button
          block
          variant="secondary"
          iconLeft="pin"
          loading={locating}
          onPress={() => void locateMe()}>
          Use my current location
        </Button>

        {customerId ? (
          <View className="gap-1 pb-2">
            {suggestions.isPending ? <Loading label="Loading the customer's places" /> : null}
            {previous.length > 0 ? (
              <>
                <AppText variant="body-strong">Visited before</AppText>
                {previous.map((point) => (
                  <OptionRow
                    key={`${point.latitude},${point.longitude}`}
                    icon="history"
                    aria-label={
                      point.label?.trim() || formatCoordinates(point.latitude, point.longitude)
                    }
                    label={
                      point.label?.trim() || formatCoordinates(point.latitude, point.longitude)
                    }
                    caption={formatCoordinates(point.latitude, point.longitude)}
                    onPress={() =>
                      pick({
                        latitude: point.latitude,
                        longitude: point.longitude,
                        label: point.label?.trim() ?? '',
                      })
                    }
                  />
                ))}
              </>
            ) : null}
            {addresses.length > 0 ? (
              <>
                <AppText variant="body-strong">Registered addresses</AppText>
                {addresses.map((item) => (
                  <OptionRow
                    key={item.uuid}
                    icon="building"
                    aria-label={item.address}
                    label={item.address}
                    caption="Tap to search this address"
                    onPress={() => submit(item.address)}
                  />
                ))}
              </>
            ) : null}
          </View>
        ) : null}
      </Sheet>
    </>
  );
}
