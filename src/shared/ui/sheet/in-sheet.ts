import { createContext } from 'react';

/** True inside a `Sheet`, which is white: controls there take a gray fill to stand out. */
export const InSheetContext = createContext(false);
