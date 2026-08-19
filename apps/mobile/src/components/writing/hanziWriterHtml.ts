import type { HanziWriterMode } from './hanziWriterTypes';

export type HanziBridge = 'rn' | 'parent';

/** Embedded page for HanziWriter. `strokeDataJp` loads hiragana/katakana JSON from jsDelivr. */
const JP_CHAR_DATA_PKG = '@k1low/hanzi-writer-data-jp@0.7.0';

export function buildHanziWriterHtml(
  char: string,
  mode: HanziWriterMode,
  bg: string,
  stroke: string,
  outline: string,
  canvasPx: number,
  bridge: HanziBridge,
  strokeDataJp = false,
): string {
  const escaped = char.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const px = Math.max(120, Math.floor(canvasPx));
  const strokeHex = stroke.replace(/'/g, "\\'");
  const outlineHex = outline.replace(/'/g, "\\'");
  const postFn =
    bridge === 'rn'
      ? `(m)=>{try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}`
      : `(m)=>{try{window.parent.postMessage(JSON.stringify({__hanzi:1,payload:m}),'*');}catch(e){}}`;

  const charDataOpt = strokeDataJp
    ? `charDataLoader:function(ch,onLoad,onError){var u=encodeURIComponent(ch);fetch('https://cdn.jsdelivr.net/npm/${JP_CHAR_DATA_PKG}/'+u+'.json').then(function(r){if(!r.ok)throw new Error();return r.json();}).then(onLoad).catch(onError);},`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>html,body{margin:0;padding:0;background:${bg};width:100%;min-height:${px}px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
#t{width:${px}px;height:${px}px;flex-shrink:0;box-sizing:border-box}</style>
<script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script></head>
<body><div id="t"></div>
<script>
const post=${postFn};
let writer=null;
const PX=${px};
const MODE='${mode}';
function start(){
  if(typeof HanziWriter==='undefined'){setTimeout(start,30);return;}
  const el=document.getElementById('t');
  if(!el)return;
  const size=PX;
  writer=HanziWriter.create('t','${escaped}',{
    ${charDataOpt}
    width:size,height:size,padding:8,
    showOutline:true,showCharacter:${mode === 'show'},
    strokeColor:'${strokeHex}',outlineColor:'${outlineHex}',radicalColor:'${strokeHex}',
    delayBetweenStrokes:220,strokeAnimationSpeed:1.2,drawingWidth:30
  });
  post({type:'ready'});
  if(MODE==='animate'){writer.loopCharacterAnimation();}
  else if(MODE==='quiz'){
    let strokes=0;
    writer.quiz({
      onMistake:(info)=>{post({type:'mistake',strokeNum:info.strokeNum,mistakesOnStroke:info.mistakesOnStroke});},
      onCorrectStroke:(info)=>{strokes++;post({type:'strokeComplete',strokeNum:info.strokeNum,isCorrect:true});},
      onComplete:(s)=>{post({type:'complete',totalMistakes:s.totalMistakes,strokes});}
    });
  }
}
setTimeout(start,0);
</script></body></html>`;
}
