/**
 * A v4 uuid that links one send to its progress steps on the server. It is not a secret, so
 * `Math.random` is enough where the platform has no `crypto.randomUUID` (Hermes may not).
 */
export function newTraceId(): string {
  const native = globalThis.crypto?.randomUUID?.();
  if (native) return native.toLowerCase();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}
