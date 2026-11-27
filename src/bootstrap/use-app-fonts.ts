import { Sora_400Regular } from '@expo-google-fonts/sora/400Regular';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { useFonts } from 'expo-font';

/**
 * Each weight is its own family: native does not pick a face from `fontWeight` reliably,
 * so text chooses the family (`font-sora`, `font-sora-semibold`)
 * instead. Returns true once the app can render: the fonts loaded, or failed and text uses the
 * system font.
 */
export function useAppFonts() {
  const [loaded, error] = useFonts({
    Sora: Sora_400Regular,
    SoraSemiBold: Sora_600SemiBold,
  });

  if (error) console.warn('Fonts failed to load, using the system font:', error);

  return loaded || error !== null;
}
