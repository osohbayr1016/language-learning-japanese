/** The browser has no splash screen; index.html paints the boot shell instead. */
export async function preventAutoHideAsync(): Promise<boolean> {
  return true;
}
export async function hideAsync(): Promise<boolean> {
  return true;
}
export function setOptions(): void {}
