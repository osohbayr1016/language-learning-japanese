/** A hidden <input type="file"> standing in for the native picker. */
export type DocumentPickerResult =
  | { canceled: true; assets: null }
  | { canceled: false; assets: { uri: string; name: string; size: number; mimeType: string; file: File }[] };

export async function getDocumentAsync(
  options: { type?: string | string[]; multiple?: boolean } = {}
): Promise<DocumentPickerResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    const type = options.type;
    if (type && type !== '*/*') input.accept = Array.isArray(type) ? type.join(',') : type;
    if (options.multiple) input.multiple = true;

    // Fires when the dialog is dismissed without choosing anything. Not
    // universally supported, so the resolve below is also guarded.
    let settled = false;
    const finish = (result: DocumentPickerResult) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(result);
    };

    input.addEventListener('cancel', () => finish({ canceled: true, assets: null }));
    input.addEventListener('change', () => {
      const files = Array.from(input.files ?? []);
      if (files.length === 0) return finish({ canceled: true, assets: null });
      finish({
        canceled: false,
        assets: files.map((file) => ({
          uri: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          mimeType: file.type,
          file,
        })),
      });
    });

    document.body.appendChild(input);
    input.click();
  });
}
