/**
 * expo-secure-store backed by localStorage.
 *
 * A browser has no keychain. localStorage is the honest equivalent: it survives
 * reloads and is origin-scoped, but it is readable by any script on the origin,
 * so this must not hold anything a leaked XSS could not be trusted with.
 */
const prefix = 'jp.';

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(prefix + key);
  } catch {
    return null;
  }
}
export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(prefix + key, value);
  } catch {
    /* private mode / quota — treated as "not persisted" */
  }
}
export async function deleteItemAsync(key: string): Promise<void> {
  try {
    localStorage.removeItem(prefix + key);
  } catch {
    /* ignore */
  }
}
export async function isAvailableAsync(): Promise<boolean> {
  return typeof localStorage !== 'undefined';
}
