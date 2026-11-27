import { clsx } from 'clsx';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ActionBar, Alert, AppText, Button, focusRing, Icon, Screen } from '@/shared/ui';

import { acquireFix } from '../capture/gps';
import { takeProofPhoto } from '../capture/photo';
import { submitFailureMessage } from '../create/draft';
import type { GpsFix, ProofPhoto, SalesVisitationDetail, VisitationSettings } from '../types';

export interface CaptureViewProps {
  mode: 'in' | 'out';
  visit: SalesVisitationDetail;
  settings: VisitationSettings;
  /** Runs with a fresh position (null when the panel does not need one) and the photo. */
  onSubmit: (fix: GpsFix | null, photo: ProofPhoto) => Promise<unknown>;
  /** The error of the write this screen started, if any. */
  error: unknown;
  /** The write is running. */
  pending: boolean;
}

/** What to tell the user about a refused or unconfirmed write. */
function failureMessage(error: unknown): string {
  const failure = toAppError(error);
  if (failure.code === 'network' || failure.code === 'timeout' || failure.code === 'server') {
    return 'Could not confirm. Open the visit to check its status before you try again.';
  }
  return submitFailureMessage(failure);
}

/**
 * The part check-in and check-out share: the rules in words, the camera photo, and one button that
 * reads the position at that moment and hands both to the screen. The position is read on press, not
 * earlier, because the server refuses a reading older than two minutes. The server does all the
 * judging (distance, time on site, flags); the screen only collects the proof.
 */
export function CaptureView({ mode, visit, settings, onSubmit, error, pending }: CaptureViewProps) {
  const online = useIsOnline();
  const [photo, setPhoto] = useState<ProofPhoto | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const verb = mode === 'in' ? 'Check in' : 'Check out';
  const busy = locating || pending;

  const takePhoto = async () => {
    setMessage(null);
    try {
      const taken = await takeProofPhoto();
      if (taken) setPhoto(taken);
    } catch (failure) {
      setMessage(toAppError(failure).message);
    }
  };

  const submit = async () => {
    if (busy) return;
    if (!photo) {
      setMessage('Take a photo first.');
      return;
    }
    setMessage(null);
    setLocating(true);
    let fix: GpsFix | null;
    try {
      fix = await acquireFix(settings.require_gps_radius);
    } catch (failure) {
      setLocating(false);
      setMessage(toAppError(failure).message);
      return;
    }
    setLocating(false);
    // A refusal is shown through `error`; nothing to catch here.
    await onSubmit(fix, photo).catch(() => undefined);
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <View className="gap-1 rounded-xl shadow-card bg-surface p-4">
          <AppText variant="caption-strong">{visit.title}</AppText>
          <AppText variant="label" tone="muted">
            {visit.customer_name ?? '-'}
          </AppText>
          {visit.location_label ? (
            <AppText variant="label" tone="muted">
              {visit.location_label}
            </AppText>
          ) : null}
        </View>

        <View className="gap-2 rounded-xl shadow-card bg-surface p-4">
          <AppText variant="caption-strong">Before you continue</AppText>
          <AppText variant="caption" tone="muted">
            {settings.require_gps_radius
              ? `Be within ${settings.radius_meters} m of the planned point. Your position is read when you press ${verb.toLowerCase()}, so keep GPS on.`
              : 'Your position is read when you press the button. It is not required for this visit.'}
          </AppText>
          {mode === 'out' ? (
            <AppText variant="caption" tone="muted">
              {`Stay on site for at least ${settings.min_onsite_minutes} minutes, or the visit is rated as left early.`}
            </AppText>
          ) : null}
        </View>

        <View className="gap-2">
          <AppText variant="caption-strong">Proof photo</AppText>
          <Pressable
            role="button"
            aria-label={photo ? 'Retake the photo' : 'Take a photo'}
            onPress={() => void takePhoto()}
            disabled={busy}
            className={clsx(
              'aspect-4/3 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-border bg-surface',
              busy && 'opacity-50',
              focusRing,
            )}>
            {photo ? (
              <Image
                contentFit="cover"
                source={{ uri: photo.uri }}
                style={StyleSheet.absoluteFill}
                accessibilityLabel="The photo you took"
              />
            ) : (
              <>
                <Icon name="upload" color="ink-muted" />
                <AppText variant="caption" tone="muted">
                  Take a photo with the camera
                </AppText>
              </>
            )}
          </Pressable>
          {photo ? (
            <Button variant="soft" disabled={busy} onPress={() => void takePhoto()}>
              Retake photo
            </Button>
          ) : null}
        </View>

        {message ? <Alert tone="danger" message={message} /> : null}
        {error ? <Alert tone="danger" message={failureMessage(error)} /> : null}
      </ScrollView>
      <ActionBar>
        {!online ? (
          <AppText variant="caption" tone="muted">
            {`You are offline. Connect to ${verb.toLowerCase()}.`}
          </AppText>
        ) : null}
        <View>
          <Button block loading={busy} disabled={!online} onPress={() => void submit()}>
            {locating ? 'Reading your position' : verb}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
