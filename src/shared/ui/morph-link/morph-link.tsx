import { Link, type Href } from 'expo-router';
import type { ReactElement } from 'react';

export interface MorphLinkProps {
  href: Href;
  /** One pressable (a card, a tile). It receives the press, so give it a `role` and a label. */
  children: ReactElement;
}

/**
 * Opens a screen from a card or tile with a zoom morph: the card grows into the screen and the
 * swipe back shrinks it again. That is a native iOS 18+ transition. Everywhere else, and in
 * tests, this is a plain push that uses the stack's fade.
 */
export function MorphLink({ href, children }: MorphLinkProps) {
  return (
    <Link href={href} asChild>
      <Link.AppleZoom>{children}</Link.AppleZoom>
    </Link>
  );
}
