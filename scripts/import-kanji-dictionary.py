"""Build the supplementary dictionary from a local kanji-data checkout.
Only KANJIDIC-derived fields are included. WaniKani fields and external
JLPT reclassifications are deliberately excluded from the derived dataset.
"""
import json,pathlib,subprocess,sys
src=pathlib.Path(sys.argv[1]);root=pathlib.Path(__file__).resolve().parents[1];out=root/'public'/'dictionary';out.mkdir(exist_ok=True)
data=json.loads((src/'kanji.json').read_text());joyo=json.loads((src/'kanji-jouyou.json').read_text());rows=[]
for char,k in data.items():
 rows.append({'char':char,'meanings':k.get('meanings') or [],'on':k.get('readings_on') or [],'kun':k.get('readings_kun') or [],'strokes':k.get('strokes'),'grade':k.get('grade'),'joyo':char in joyo})
rows.sort(key=lambda k:(not k['joyo'], k['grade'] or 99,ord(k['char'])))
(out/'kanji.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n')
sha=subprocess.check_output(['git','-C',str(src),'rev-parse','HEAD'],text=True).strip()
(out/'source.json').write_text(json.dumps({'entries':len(rows),'joyo':len(joyo),'source':'KANJIDIC via davidluzgouveia/kanji-data','revision':sha,'license':'CC-BY-SA-4.0','fields':['char','meanings','readings_on','readings_kun','strokes','grade'],'sourceUrl':'https://github.com/davidluzgouveia/kanji-data','licenseUrl':'https://www.edrdg.org/edrdg/licence.html'},indent=2)+'\n')
(out/'LICENSE.txt').write_text('This file uses the KANJIDIC dictionary files, property of James William BREEN and the Electronic Dictionary Research and Development Group, in conformance with the EDRDG licence.\nhttps://www.edrdg.org/wiki/index.php/KANJIDIC_Project\nhttps://www.edrdg.org/edrdg/licence.html\nCC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/\nConversion: selected Japanese readings, English meanings, stroke count and grade, with joyo membership from kanji-jouyou.json. WaniKani fields and SKIP codes are not included.\nUpstream JSON conversion by David Luz Gouveia, commit '+sha+'\nhttps://github.com/davidluzgouveia/kanji-data\n\n'+(src/'LICENSE').read_text())
print(len(rows),'entries;',len(joyo),'joyo')
