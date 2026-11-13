import {getApiBase} from '@src/lib/api/client';
let audio:HTMLAudioElement|null=null;
let generation=0;
export function stopJapaneseAudio(){
  generation++;
  if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null}
  if('speechSynthesis' in window)speechSynthesis.cancel();
}
const FAILURE='Япон дууг тоглуулж чадсангүй. Холболтоо шалгаад дахин оролдоно уу. Төхөөрөмжид япон дуу нэмбэл сервергүйгээр сонсож болно.';
/** Resolve only after playback starts; never select a non-Japanese voice. */
export function speakJapanese(text:string,onError?:(message:string)=>void,onStarted?:()=>void){
  stopJapaneseAudio();
  const current=generation;
  const report=()=>{if(current===generation)onError?.(FAILURE)};
  const run=async()=>{
    const voice='speechSynthesis' in window?speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('ja')):undefined;
    if(voice){
      await new Promise<void>((resolve,reject)=>{
        const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.voice=voice;u.rate=.8;
        const timeout=setTimeout(()=>reject(Error('Audio timeout')),8000);
        u.onstart=()=>{clearTimeout(timeout);resolve()};
        u.onerror=()=>{clearTimeout(timeout);report();reject(Error('Japanese synthesis unavailable'))};
        speechSynthesis.speak(u);
      });
      return;
    }
    // Public authored text only; no microphone recording is sent to the TTS route.
    const url=getApiBase()+'/api/audio/tts?'+new URLSearchParams({text,speed:'slow'});
    const sound=new globalThis.Audio(url);audio=sound;sound.preload='auto';sound.onerror=report;
    let timeout:ReturnType<typeof setTimeout>|undefined;
    try{
      await Promise.race([sound.play(),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(Error('Audio timeout')),8000)})]);
    }finally{if(timeout)clearTimeout(timeout)}
  };
  void run().then(()=>{if(current===generation)onStarted?.()}).catch(report);
}
