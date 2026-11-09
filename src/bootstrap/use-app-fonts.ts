import { Rubik_400Regular } from '@expo-google-fonts/rubik/400Regular';
import { Rubik_500Medium } from '@expo-google-fonts/rubik/500Medium';
import { useFonts } from 'expo-font';

/**
 * Each weight is its own family: native does not pick a face from `fontWeight` reliably,
 * so text chooses the family (`font-rubik` or `font-rubik-medium`) instead.
 * Returns true once the app can render: the fonts loaded, or failed and text uses the system font.
 */
export function useAppFonts() {
  const [loaded, error] = useFonts({
    Rubik: Rubik_400Regular,
    RubikMedium: Rubik_500Medium,
  });

  if (error) console.warn('Fonts failed to load, using the system font:', error);

  return loaded || error !== null;
}
