export function createURL(path: string): string {
  return new URL(path, window.location.origin).toString();
}
export async function openURL(url: string): Promise<void> {
  window.open(url, '_blank', 'noopener,noreferrer');
}
export async function canOpenURL(): Promise<boolean> {
  return true;
}
export async function getInitialURL(): Promise<string | null> {
  return window.location.href;
}
export function useURL(): string | null {
  return typeof window === 'undefined' ? null : window.location.href;
}
