export type WebKeyboardEvent = {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
};

type WebKeyboardTarget = {
  addEventListener: (type: 'keydown', listener: (event: WebKeyboardEvent) => void) => void;
  removeEventListener: (type: 'keydown', listener: (event: WebKeyboardEvent) => void) => void;
};

export function getWebKeyboardTarget(): WebKeyboardTarget | null {
  const target = globalThis as unknown as Partial<WebKeyboardTarget>;
  if (typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function') {
    return null;
  }
  return target as WebKeyboardTarget;
}
