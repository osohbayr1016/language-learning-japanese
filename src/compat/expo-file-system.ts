/** Only the read-a-picked-file path is used; the browser File API covers it. */
export const EncodingType = { UTF8: 'utf8', Base64: 'base64' } as const;

export async function readAsStringAsync(
  uri: string,
  options?: { encoding?: string }
): Promise<string> {
  const res = await fetch(uri);
  if (options?.encoding === EncodingType.Base64) {
    const buf = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  return res.text();
}

export async function writeAsStringAsync(): Promise<void> {
  throw new Error('Writing files is not supported in the browser');
}
export async function deleteAsync(): Promise<void> {}
export const documentDirectory: string | null = null;
export const cacheDirectory: string | null = null;
