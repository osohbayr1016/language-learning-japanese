import { Platform } from 'react-native';

type RecInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onresult: ((ev: WebSpeechResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type WebAlternative = { transcript: string; confidence?: number };

/** Each result is array-like over its alternatives, ranked best-first. */
type WebSpeechResult = ArrayLike<WebAlternative> & { isFinal: boolean };

type WebSpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<WebSpeechResult>;
};

type RecCtor = new () => RecInstance;

type GlobalWeb = typeof globalThis & {
  SpeechRecognition?: RecCtor;
  webkitSpeechRecognition?: RecCtor;
  navigator?: {
    mediaDevices?: {
      getUserMedia: (c: { audio: boolean }) => Promise<{ getTracks: () => Array<{ stop: () => void }> }>;
    };
  };
};

export function getWebSpeechCtor(): RecCtor | null {
  if (Platform.OS !== 'web') return null;
  const g = globalThis as GlobalWeb;
  return g.SpeechRecognition ?? g.webkitSpeechRecognition ?? null;
}

export function webSpeechAvailable(): boolean {
  return getWebSpeechCtor() !== null;
}

export async function ensureWebMicAccess(): Promise<boolean> {
  try {
    const nav = (globalThis as GlobalWeb).navigator;
    if (!nav?.mediaDevices?.getUserMedia) {
      return webSpeechAvailable();
    }
    const stream = await nav.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export type WebRecHandle = { stop: () => void; abort: () => void };

export function startWebContinuousSession(
  onStart: () => void,
  onInterim: (preview: string) => void,
  onFinal: (text: string, confidence: number, alternatives: string[]) => void,
  onError: (msg: string) => void,
  onSessionEnd: () => void
): WebRecHandle | null {
  const Ctor = getWebSpeechCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'ja-JP';
  rec.interimResults = true;
  rec.maxAlternatives = 3;
  rec.continuous = true;

  let finalBuf = '';
  let aborted=false,failed=false,ended=false;
  let lastFinalAlts:string[]=[],beforeLastFinal='';
  let confidence=0;
  rec.onstart=()=>{if(!aborted)onStart()};
  rec.onerror=e=>{
    if(aborted)return;
    if(e.error==='no-speech'&&finalBuf.trim()){rec.stop();return;}
    failed=true;
    const messages:Record<string,string>={
      'not-allowed':'Микрофоны зөвшөөрөл хэрэгтэй',
      'service-not-allowed':'Япон яриа таних үйлчилгээ зөвшөөрөгдөөгүй',
      'no-speech':'Дуу олдсонгүй. Дахин оролдоно уу',
      'network':'Яриа таних үйлчилгээтэй холбогдож чадсангүй',
      'language-not-supported':'Энэ төхөөрөмж япон яриа танихыг дэмжихгүй байна',
      'audio-capture':'Микрофон олдсонгүй',
    };
    onError(messages[e.error]??'Яриа таних алдаа: '+e.error);
  };
  rec.onend=()=>{
    if(aborted||ended)return;ended=true;
    const text=finalBuf.trim();
    // Interim guesses and permission/network errors are never learner grades.
    if(!failed&&text)onFinal(text,confidence,lastFinalAlts.map(a=>(beforeLastFinal+a).trim()).filter(a=>a&&a!==text));
    else if(!failed)onError('Дууг эцэслэн таньсангүй. Дахин оролдоно уу');
    onSessionEnd();
  };
  rec.onresult=ev=>{
    if(aborted||failed)return;
    // Rebuild from the recognizer's authoritative results; repeated final events
    // must not duplicate syllables in the transcript.
    finalBuf='';let interim='';let totalConfidence=0,segments=0;
    for(let i=0;i<ev.results.length;i++){
      const seg=ev.results[i],piece=seg[0].transcript;
      if(seg.isFinal){beforeLastFinal=finalBuf;lastFinalAlts=Array.from({length:seg.length},(_,k)=>seg[k].transcript);finalBuf+=piece;totalConfidence+=seg[0].confidence??0;segments++;}
      else interim+=piece;
    }
    confidence=segments?totalConfidence/segments:0;
    onInterim((finalBuf+interim).trim());
  };
  try {
    rec.start();
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Яриа таних ажиллахгүй байна');
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    },
    abort: () => {
      aborted=true;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    },
  };
}
