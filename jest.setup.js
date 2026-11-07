// The real safe-area hooks throw without a native provider. Docs: react-native-safe-area-context testing.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
