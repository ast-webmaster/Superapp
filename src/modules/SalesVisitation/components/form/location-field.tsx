import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { toAppError } from '@/core/errors';
import {
  AppText,
  Button,
  focusRing,
  Icon,
  Loading,
  Sheet,
  TextField,
  type IconName,
} from '@/shared/ui';

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

/** A tappable result row: a title with the coordinates or a hint under it. */
function ChoiceRow({
  title,
  caption,
  icon,
  onPress,
}: {
  title: string;
  caption?: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      aria-label={title}
      onPress={onPress}
      className={clsx(
        'min-h-control flex-row items-center gap-3 rounded-md px-3 py-2 active:bg-surface-gray',
        focusRing,
      )}>
      <Icon name={icon} color="ink-muted" />
      <View className="min-w-0 flex-1">
        <AppText variant="caption-strong" numberOfLines={2}>
          {title}
        </AppText>
        {caption ? (
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {caption}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Where the visit takes place. A point comes from one of: this device's position, an address
 * search, a pasted Google Maps link or "lat, lng", or (for a registered customer) a point it was
 * visited at before or one of its registered addresses. The server later measures check-in and
 * check-out against this point. There is no map inside the app: the point is shown as text.
 */
export function LocationField({ value, onChange, customerId, error }: LocationFieldProps) {
  const [open, setOpen] = useState(false);
  const [addressText, setAddressText] = useState('');
  const [searched, setSearched] = useState<string | null>(null);
  const [linkText, setLinkText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const suggestions = useCustomerLocations(open ? customerId : null);
  const geocode = useGeocode(open ? searched : null);
  const mapLink = useMapLink();

  const pick = (point: LocationPoint) => {
    onChange(point);
    setOpen(false);
  };

  const searchAddress = (text: string) => {
    const term = text.trim();
    if (term.length < GEOCODE_MIN_CHARS) {
      setMessage(`Type at least ${GEOCODE_MIN_CHARS} characters of the address.`);
      return;
    }
    setMessage(null);
    setAddressText(term);
    setSearched(term);
  };

  const locateMe = async () => {
    setMessage(null);
    setLocating(true);
    try {
      const fix = await readPosition();
      pick({ latitude: fix.latitude, longitude: fix.longitude, label: 'Current location' });
    } catch (error) {
      setMessage(toAppError(error).message);
    } finally {
      setLocating(false);
    }
  };

  const readLink = () => {
    const text = linkText.trim();
    if (!text) return;
    setMessage(null);
    // Plain coordinates need no round trip; anything else is a link the server reads.
    const plain = parseCoordinates(text);
    if (plain) {
      pick({ ...plain, label: 'Pinned location' });
      return;
    }
    mapLink.mutate(text, {
      onSuccess: ({ lat, lng }) =>
        pick({ latitude: lat, longitude: lng, label: 'Pinned location' }),
      onError: (error) => setMessage(toAppError(error).message),
    });
  };

  const previous = suggestions.data?.previous_visits ?? [];
  const addresses = suggestions.data?.addresses ?? [];

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
        {message ? (
          <AppText variant="caption" tone="danger" aria-live="polite">
            {message}
          </AppText>
        ) : null}

        <Button
          block
          variant="secondary"
          iconLeft="pin"
          loading={locating}
          onPress={() => void locateMe()}>
          Use my current location
        </Button>

        <View className="gap-2">
          <TextField
            label="Search an address"
            placeholder="Street, building or place name"
            value={addressText}
            onChangeText={setAddressText}
            returnKeyType="search"
            onSubmitEditing={() => searchAddress(addressText)}
            trailing={
              <Button size="sm" variant="soft" onPress={() => searchAddress(addressText)}>
                Search
              </Button>
            }
          />
          {geocode.isFetching ? (
            <Loading label="Searching the address" />
          ) : geocode.error ? (
            <AppText variant="caption" tone="danger">
              {toAppError(geocode.error).message}
            </AppText>
          ) : geocode.data ? (
            geocode.data.length > 0 ? (
              geocode.data.map((hit) => (
                <ChoiceRow
                  key={`${hit.lat},${hit.lng},${hit.label}`}
                  icon="search"
                  title={hit.label}
                  caption={formatCoordinates(hit.lat, hit.lng)}
                  onPress={() => pick({ latitude: hit.lat, longitude: hit.lng, label: hit.label })}
                />
              ))
            ) : (
              <AppText variant="caption" tone="muted">
                No place found. Try fewer words, or paste a Google Maps link below.
              </AppText>
            )
          ) : null}
        </View>

        <View className="gap-2">
          <TextField
            label="Google Maps link or coordinates"
            placeholder="https://maps.app.goo.gl/… or -6.2, 106.8"
            value={linkText}
            onChangeText={setLinkText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            help="A link with only a place name has no coordinates. Pick the point in Google Maps first."
            trailing={
              <Button size="sm" variant="soft" loading={mapLink.isPending} onPress={readLink}>
                Use
              </Button>
            }
          />
        </View>

        {customerId ? (
          <View className="gap-1 pb-2">
            {suggestions.isPending ? <Loading label="Loading the customer's places" /> : null}
            {previous.length > 0 ? (
              <>
                <AppText variant="body-strong">Visited before</AppText>
                {previous.map((point) => (
                  <ChoiceRow
                    key={`${point.latitude},${point.longitude}`}
                    icon="history"
                    title={
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
                  <ChoiceRow
                    key={item.uuid}
                    icon="building"
                    title={item.address}
                    caption="Tap to search this address"
                    onPress={() => searchAddress(item.address)}
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
