// expo-secure-store has no web implementation. localStorage is NOT secure storage:
// this keeps the web build working for development, nothing more.
export const secureStorage = {
  get: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  set: async (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
  remove: async (key: string) => globalThis.localStorage?.removeItem(key),
};
