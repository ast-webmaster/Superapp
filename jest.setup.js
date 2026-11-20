// The real safe-area hooks throw without a native provider. Docs: react-native-safe-area-context testing.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Gesture handler has no native module in Jest. Docs: react-native-gesture-handler testing.
require('react-native-gesture-handler/jestSetup');

// Under Jest the worklets package resolves to its web build, where this throws. Gesture handler
// asks for the holder when it loads, so give it an empty one: there is no UI runtime to bind.
jest.mock('react-native-worklets', () => ({
  ...jest.requireActual('react-native-worklets'),
  getUIRuntimeHolder: () => ({}),
}));
