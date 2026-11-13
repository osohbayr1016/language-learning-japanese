"""Optional maintainer tool. Install fonttools; pass local, licensed Noto sources.
No font processing or CDN download is required by the application build.
"""
import argparse
import json
import re
from pathlib import Path
from fontTools import subset
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--ui-font', required=True, type=Path)
parser.add_argument('--jp-font', required=True, type=Path)
args = parser.parse_args()
inventory = json.loads((root / 'public/fonts/source.json').read_text())
for label, source, family, filename, index in [
    ('ui', args.ui_font, 'NihongoUI', 'nihongo-ui-regular.woff', -1),
    ('jp', args.jp_font, 'NihongoJP', 'nihongo-jp.woff', 0),
]:
    font = TTFont(source, fontNumber=index)
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.name_legacy = True
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=inventory[label]['codepoints'])
    sub.subset(font)
    for name_id, value in {1: family, 2: 'Regular', 3: family+'-Regular', 4: family, 6: family+'-Regular', 16: family, 17: 'Regular'}.items():
        font['name'].setName(value, name_id, 3, 1, 0x409)
    if 'CFF ' in font:
        font['CFF '].cff.fontNames = [family]
        for top in font['CFF '].cff.topDictIndex:
            top.FamilyName = family
            top.FullName = family
    font.flavor = 'woff'
    font.save(root / 'public/fonts' / filename)

vendor = root / 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons'
font = TTFont(vendor / 'Fonts/Ionicons.ttf')
glyph_map = json.loads((vendor / 'glyphmaps/Ionicons.json').read_text())
names = set()
for directory in [root / 'src', root / 'apps/mobile/src']:
    for file in directory.rglob('*'):
        if file.suffix in ['.ts', '.tsx']:
            names.update(s for s in re.findall(r"['\"]([a-z][a-z0-9-]*)['\"]", file.read_text()) if s in glyph_map)
paths = {}
for name in sorted(names):
    pen = SVGPathPen(font.getGlyphSet())
    font.getGlyphSet()[font.getBestCmap()[glyph_map[name]]].draw(pen)
    paths[name] = pen.getCommands()
core_names = ['home','home-outline','barbell','barbell-outline','stats-chart','stats-chart-outline','person-circle','person-circle-outline','chevron-back','chevron-forward','checkmark','refresh','book','mic','headset','create','close']
(root / 'public/icons.json').write_text(json.dumps(paths, separators=(',', ':'))+'\n')
(root / 'src/compat/icon-core.json').write_text(json.dumps({name: paths[name] for name in core_names}, separators=(',', ':'))+'\n')
print('Generated renamed, licensed WOFF subsets and', len(paths), 'SVG icon outlines.')
