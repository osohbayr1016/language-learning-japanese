/**
 * IDs are deduplication keys, not credentials. Native Expo environments may not
 * expose Web Crypto's randomUUID, so keep a non-secret fallback for the offline UI.
 */
export function newSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `session_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}
