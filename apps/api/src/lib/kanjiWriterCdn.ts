import counts from '../../../../packages/curriculum/src/stroke-counts.json';
/** Japanese KanjiVG stroke counts; no remote fallback. */
export async function fetchKanjiWriterMeta(char: string): Promise<{strokeCount:number}|null> {
 const n=(counts as Record<string,number>)[char];return n?{strokeCount:n}:null;
}
