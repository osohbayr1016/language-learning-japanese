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
  let lastPreview = '';
  /** Text committed before the newest final segment, and that segment's hypotheses. */
  let beforeLastFinal = '';
  let lastFinalAlts: string[] = [];

  rec.onstart = () => onStart();
  rec.onerror = (e: { error: string }) => {
    const code = e.error;
    if (code === 'no-speech' && (lastPreview || finalBuf).trim()) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      return;
    }
    const msg =
      code === 'not-allowed'
        ? 'Микрофоны зөвшөөрөл хэрэгтэй'
        : code === 'no-speech'
          ? 'Дуу олдсонгүй. Дахин оролдоно уу'
          : String(code);
    onError(msg);
  };
  rec.onend = () => {
    const text = (lastPreview || finalBuf).trim();
    const alternatives = lastFinalAlts
      .map((alt) => (beforeLastFinal + alt).trim())
      .filter((alt) => alt && alt !== text);
    if (text) onFinal(text, 0, alternatives);
    onSessionEnd();
  };
  rec.onresult = (ev: WebSpeechResultEvent) => {
    let interim = '';
    const n = ev.results.length;
    for (let i = ev.resultIndex; i < n; i++) {
      const seg = ev.results[i];
      const piece = seg[0].transcript;
      if (seg.isFinal) {
        beforeLastFinal = finalBuf;
        lastFinalAlts = Array.from({ length: seg.length }, (_, k) => seg[k].transcript);
        finalBuf += piece;
      } else interim += piece;
    }
    lastPreview = (finalBuf + interim).trim();
    onInterim(lastPreview);
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
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    },
  };
}
