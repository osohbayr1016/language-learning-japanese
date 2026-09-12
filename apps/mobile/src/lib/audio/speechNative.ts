let mod: typeof import('expo-speech-recognition') | null = null;
try {
  mod = require('expo-speech-recognition');
} catch {
  mod = null;
}

export const SPEECH_SUPPORTED = !!mod?.ExpoSpeechRecognitionModule;

export async function nativeEnsurePermission(): Promise<boolean> {
  if (!SPEECH_SUPPORTED || !mod) return false;
  try {
    const current = await mod.ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (current.granted) return true;
    const next = await mod.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return !!next.granted;
  } catch {
    return false;
  }
}

export function nativeStart(contextual?: string[]): void {
  if (!SPEECH_SUPPORTED || !mod) return;
  mod.ExpoSpeechRecognitionModule.start({
    lang: 'ja-JP',
    interimResults: true,
    maxAlternatives: 3,
    continuous: true,
    contextualStrings: contextual,
    requiresOnDeviceRecognition: false,
  });
}

export function nativeStop(): void {
  if (!SPEECH_SUPPORTED || !mod) return;
  try {
    mod.ExpoSpeechRecognitionModule.stop();
  } catch {
    /* ignore */
  }
}

export function nativeAbort(): void {
  if (!SPEECH_SUPPORTED || !mod) return;
  try {
    mod.ExpoSpeechRecognitionModule.abort();
  } catch {
    /* ignore */
  }
}

type EventName = 'start' | 'end' | 'result' | 'error';
export type NativeSpeechEventHook = (name: EventName, cb: (event: unknown) => void) => void;

const noopHook: NativeSpeechEventHook = () => {};
export const useNativeSpeechEvent: NativeSpeechEventHook = SPEECH_SUPPORTED
  ? (mod!.useSpeechRecognitionEvent as unknown as NativeSpeechEventHook)
  : noopHook;
