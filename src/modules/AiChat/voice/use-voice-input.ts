import { requireOptionalNativeModule } from 'expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useToast } from '@/shared/ui';

type SpeechModule = (typeof import('expo-speech-recognition'))['ExpoSpeechRecognitionModule'];
type Subscription = { remove: () => void };

// The web chat's defaults (config('aichat.voice')): Indonesian, and the text is never sent by itself.
const LANG = 'id-ID';
// Not failures worth telling the user about: they stopped it, or said nothing.
const QUIET_ERRORS = ['aborted', 'no-speech'];

/**
 * Whether this device can turn speech into text. A build made before expo-speech-recognition was
 * added has no native module, and importing the package then throws, so look for it first. The web
 * needs the browser's speech API and a secure page (Chrome refuses the mic on plain http).
 */
function isSupported() {
  if (Platform.OS !== 'web') return requireOptionalNativeModule('ExpoSpeechRecognition') !== null;
  const scope = globalThis as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  const hasApi =
    scope.SpeechRecognition !== undefined || scope.webkitSpeechRecognition !== undefined;
  return hasApi && (globalThis as { isSecureContext?: boolean }).isSecureContext !== false;
}

/** Loaded only once the mic is used and the module is known to exist (see `isSupported`). */
function loadSpeechModule(): SpeechModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy on purpose, see above
  const pkg = require('expo-speech-recognition') as typeof import('expo-speech-recognition');
  return pkg.ExpoSpeechRecognitionModule;
}

export interface VoiceInput {
  supported: boolean;
  listening: boolean;
  start: () => Promise<void>;
  /** Stops listening and keeps the last words heard. */
  stop: () => void;
  /** Stops listening and drops anything still to come, such as when the message is sent. */
  cancel: () => void;
}

const PERMISSION_MESSAGE = 'Allow microphone access in Settings to use voice input.';
const FAILED_MESSAGE = 'Voice input stopped. Try again.';

/**
 * Speech to text into the message field. What it hears is added after the text already typed
 * (`value` when listening starts), live while the user speaks; the user reviews it and sends.
 */
export function useVoiceInput(value: string, onText: (text: string) => void): VoiceInput {
  const toast = useToast();
  const [supported] = useState(isSupported);
  const [listening, setListening] = useState(false);
  const latest = useRef({ value, onText });
  const speech = useRef<SpeechModule | null>(null);
  const subscriptions = useRef<Subscription[]>([]);
  // Set from the tap until listening is set up, so a second tap during the prompt does nothing.
  const busy = useRef(false);

  useEffect(() => {
    latest.current = { value, onText };
  }, [value, onText]);

  const release = useCallback(() => {
    subscriptions.current.forEach((subscription) => subscription.remove());
    subscriptions.current = [];
    busy.current = false;
    setListening(false);
  }, []);

  // Leaving the screen ends the session; nothing keeps listening in the background.
  useEffect(
    () => () => {
      if (subscriptions.current.length > 0) speech.current?.abort();
      subscriptions.current.forEach((subscription) => subscription.remove());
    },
    [],
  );

  const start = useCallback(async () => {
    if (!supported || busy.current) return;
    busy.current = true;
    try {
      const module = loadSpeechModule();
      speech.current = module;
      const permission = await module.requestPermissionsAsync();
      if (!permission.granted) {
        busy.current = false;
        toast.show({ tone: 'warning', message: PERMISSION_MESSAGE });
        return;
      }

      const typed = latest.current.value.trimEnd();
      const prefix = typed ? `${typed} ` : '';
      subscriptions.current = [
        module.addListener('result', (event) => {
          latest.current.onText(prefix + (event.results[0]?.transcript ?? ''));
        }),
        module.addListener('end', release),
        module.addListener('error', (event) => {
          release();
          if (event.error === 'not-allowed') {
            toast.show({ tone: 'warning', message: PERMISSION_MESSAGE });
          } else if (!QUIET_ERRORS.includes(event.error)) {
            toast.show({ tone: 'danger', message: FAILED_MESSAGE });
          }
        }),
      ];
      setListening(true);
      module.start({ lang: LANG, interimResults: true, continuous: false });
    } catch {
      release();
      toast.show({ tone: 'danger', message: FAILED_MESSAGE });
    }
  }, [supported, toast, release]);

  const stop = useCallback(() => {
    speech.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    if (subscriptions.current.length === 0) return;
    release();
    speech.current?.abort();
  }, [release]);

  return { supported, listening, start, stop, cancel };
}
