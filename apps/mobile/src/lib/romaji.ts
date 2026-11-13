export function normalizeRomaji(romaji: string): string {
  return romaji
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s/g, '');
}
