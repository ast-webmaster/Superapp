/**
 * Press feedback for a button-like control: it shrinks to 97% in 120ms while pressed and eases
 * back. A transition, so letting go mid-press reverses from where it is. Not for full-width list
 * rows, which change their background instead.
 */
export const pressScale = 'transition-transform duration-120 ease-press active:scale-97';
