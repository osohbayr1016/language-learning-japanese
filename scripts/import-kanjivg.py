"""Convert a local KanjiVG checkout to compact, self-hosted stroke buckets.
Usage: python scripts/import-kanjivg.py /path/to/kanjivg
No network fetch occurs at runtime. Derived data remains CC BY-SA 3.0.
"""
import json, pathlib, re, subprocess, sys, xml.etree.ElementTree as ET
source = pathlib.Path(sys.argv[1]); root = pathlib.Path(__file__).resolve().parents[1]
out = root / 'public' / 'stroke-data'; out.mkdir(parents=True, exist_ok=True)
buckets = {}; counts = {}
for file in sorted((source/'kanji').glob('*.svg')):
    if not re.fullmatch('[0-9a-f]{5}', file.stem): continue
    code = int(file.stem, 16); char = chr(code)
    if not (0x3040 <= code <= 0x30ff or 0x3400 <= code <= 0x9fff): continue
    svg = ET.parse(file).getroot()
    paths = [p.attrib['d'] for p in svg.iter('{http://www.w3.org/2000/svg}path') if re.search(r'-s\d+$',p.attrib.get('id',''))]
    if not paths: continue
    key = format(code // 128, 'x')
    buckets.setdefault(key,{})[char] = paths; counts[char] = len(paths)
for key,value in buckets.items():
    (out/f'{key}.json').write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n')
sha=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
(out/'manifest.json').write_text(json.dumps({'source':'KanjiVG','url':'https://kanjivg.tagaini.net/','revision':sha,'license':'CC-BY-SA-3.0','characters':len(counts),'bucketSize':128,'counts':counts},ensure_ascii=False,separators=(',',':'))+'\n')
# Small count index for server-side word administration; no remote Mandarin fallback.
(root/'packages/curriculum/src/stroke-counts.json').write_text(json.dumps(counts,ensure_ascii=False,separators=(',',':'))+'\n')
(out/'LICENSE.txt').write_text('Derived from KanjiVG, copyright © 2009–2026 Ulrich Apel and contributors.\nhttps://kanjivg.tagaini.net/\nSource commit: '+sha+'\nConverted from SVG to JSON path arrays; geometry and stroke order retained.\nCreative Commons Attribution-ShareAlike 3.0 Unported\nhttps://creativecommons.org/licenses/by-sa/3.0/\n\n'+(source/'COPYING').read_text())
print(len(counts),'glyphs in',len(buckets),'buckets; source',sha)
