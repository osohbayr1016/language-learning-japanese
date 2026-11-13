import type { KanjiWriterMode } from './kanjiWriterTypes';
import { matchesStroke } from '../../../../../packages/curriculum/src/strokes';
export type KanjiBridge = 'rn' | 'parent';
/** Self-hosted Japanese KanjiVG paths, shared by browser and native WebView. */
export function buildKanjiWriterHtml(
  char: string,
  mode: KanjiWriterMode,
  bg: string,
  stroke: string,
  outline: string,
  canvasPx: number,
  bridge: KanjiBridge,
  _strokeDataJp = false,
): string {
  const px = Math.max(120, Math.floor(canvasPx));
  const safe = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
  const base =
    bridge === 'rn' ? 'https://nihongo-mn-web.osohoo691016.workers.dev' : '';
  const post =
    bridge === 'rn'
      ? `window.ReactNativeWebView?.postMessage(JSON.stringify(m))`
      : `window.parent.postMessage(JSON.stringify({__kanji:1,payload:m}),'*')`;
  // Include the pure geometry validator directly: no third-party script or Chinese character fallback.
  return `<!doctype html><html lang="mn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
 *{box-sizing:border-box}body{margin:0;background:${bg};font-family:system-ui;color:${stroke}}svg{width:100%;height:100%;touch-action:none;display:block}#box{width:${px}px;height:${px}px;position:relative}#status{position:absolute;bottom:5px;left:6px;right:6px;font-size:11px;text-align:center;background:${bg}dd;pointer-events:none}button{min-height:40px}</style>
 <div id="box"><svg viewBox="0 0 109 109" aria-label="Япон бичлэгийн дасгал"><path d="M54.5 0V109M0 54.5H109M0 0L109 109M109 0L0 109" stroke="${outline}" stroke-width=".5" stroke-dasharray="2 2"/><g id="paths" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5"></g><path id="ink" fill="none" stroke="#cc542d" stroke-width="3.5" stroke-linecap="round"/><g id="nums" font-size="5" fill="${stroke}"></g></svg><div id="status" role="status">Зурлагыг ачаалж байна…</div></div>
 <script>const CHAR=${safe(char)},MODE=${safe(mode)},BASE=${safe(base)};const post=m=>{${post}};const match=${matchesStroke.toString()};const svg=document.querySelector('svg'),group=document.getElementById('paths'),nums=document.getElementById('nums'),ink=document.getElementById('ink'),status=document.getElementById('status');let paths=[],samples=[],index=0,mistakes=0,points=[],drawing=false,finished=false;
 function point(e){const r=svg.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*109,y:(e.clientY-r.top)/r.height*109}}
 function hint(){status.textContent=MODE==='quiz'?'Зурлага '+(index+1)+' / '+paths.length+' · Эхлэх дугаарыг дагаарай':'Зурлагын дараалал · '+paths.length+' зурлага';paths.forEach((p,i)=>p.setAttribute('stroke',MODE==='quiz'?(i<index?${safe(stroke)}:i===index?'#b8b0a1':${safe(outline)}):${safe(stroke)}))}
 function animate(){let delay=0;paths.forEach(p=>{const len=p.getTotalLength();p.style.strokeDasharray=len;p.style.strokeDashoffset=len;p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:650,delay,fill:'forwards'});delay+=850});}
 svg.addEventListener('pointerdown',e=>{if(MODE!=='quiz'||finished||!paths.length)return;drawing=true;points=[point(e)];svg.setPointerCapture(e.pointerId);e.preventDefault()});
 svg.addEventListener('pointermove',e=>{if(!drawing)return;points.push(point(e));ink.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' '));});
 svg.addEventListener('pointercancel',()=>{drawing=false;points=[];ink.setAttribute('d','')});
 svg.addEventListener('pointerup',e=>{if(!drawing)return;drawing=false;points.push(point(e));ink.setAttribute('d','');if(match(points,samples[index])){post({type:'strokeComplete',strokeNum:index,isCorrect:true});index++;if(index===paths.length){finished=true;paths.forEach(p=>p.setAttribute('stroke',${safe(stroke)}));status.textContent='Зөв дарааллаар бичлээ';post({type:'complete',totalMistakes:mistakes,strokes:paths.length});return;}hint();}else{mistakes++;post({type:'mistake',strokeNum:index,mistakesOnStroke:mistakes});status.textContent='Дараалал, чиглэлээ шалгаад дахин бичээрэй';paths[index].animate([{stroke:'#cc542d'},{stroke:'#b8b0a1'}],{duration:500});}});
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
 fetch(BASE+'/stroke-data/'+Math.floor(CHAR.codePointAt(0)/128).toString(16)+'.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{const ds=data[CHAR];if(!Array.isArray(ds)||!ds.length)throw Error();ds.forEach((d,i)=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);group.appendChild(p);paths.push(p);const len=p.getTotalLength();samples.push(Array.from({length:48},(_,j)=>{const pt=p.getPointAtLength(len*j/47);return {x:pt.x,y:pt.y}}));const start=p.getPointAtLength(0);const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',Math.max(2,start.x-5));t.setAttribute('y',Math.max(6,start.y-3));t.textContent=String(i+1);nums.appendChild(t);});hint();post({type:'ready'});if(MODE==='animate'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)animate();}).catch(()=>{status.textContent='Зурлагыг ачаалж чадсангүй. Дахин ачаална уу.';post({type:'error',message:'Япон зурлагын өгөгдөл олдсонгүй'});}).finally(()=>clearTimeout(timeout));
 </script></html>`;
}
