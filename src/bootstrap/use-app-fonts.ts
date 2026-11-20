import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { useFonts } from 'expo-font';

/**
 * Each weight is its own family: native does not pick a face from `fontWeight` reliably,
 * so text chooses the family (`font-jakarta`, `font-jakarta-semibold`, `font-jakarta-extrabold`)
 * instead. Returns true once the app can render: the fonts loaded, or failed and text uses the
 * system font.
 */
export function useAppFonts() {
  const [loaded, error] = useFonts({
    PlusJakartaSans: PlusJakartaSans_400Regular,
    PlusJakartaSansSemiBold: PlusJakartaSans_600SemiBold,
    PlusJakartaSansExtraBold: PlusJakartaSans_800ExtraBold,
  });

  if (error) console.warn('Fonts failed to load, using the system font:', error);

  return loaded || error !== null;
}
