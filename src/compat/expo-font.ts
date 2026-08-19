/** Fonts are loaded by <link> in index.html, so there is nothing to wait for. */
export function useFonts(_map?: unknown): [boolean, Error | null] {
  return [true, null];
}
export async function loadAsync(): Promise<void> {}
export function isLoaded(): boolean {
  return true;
}
