import { Platform } from 'react-native';

import {
  createJapaneseRecognitionSession,
  type RecCtor,
  type WebRecHandle,
} from './recognitionSession';
export type { WebRecHandle } from './recognitionSession';
type GlobalWeb = typeof globalThis & {
  SpeechRecognition?: RecCtor;
  webkitSpeechRecognition?: RecCtor;
  navigator?: {
    mediaDevices?: {
      getUserMedia: (c: {
        audio: boolean;
      }) => Promise<{ getTracks: () => Array<{ stop: () => void }> }>;
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

export function startWebContinuousSession(
  onStart: () => void,
  onInterim: (text: string) => void,
  onFinal: (text: string, confidence: number, alternatives: string[]) => void,
  onError: (message: string) => void,
  onSessionEnd: () => void,
): WebRecHandle | null {
  const Ctor = getWebSpeechCtor();
  return Ctor
    ? createJapaneseRecognitionSession(
        Ctor,
        onStart,
        onInterim,
        onFinal,
        onError,
        onSessionEnd,
      )
    : null;
}
