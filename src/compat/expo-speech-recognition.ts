/**
 * Deliberately empty.
 *
 * src/lib/audio/speechNative.ts probes for this module and, when the native
 * recogniser is absent, falls back to the Web Speech API path in speechWeb.ts —
 * which is the correct implementation in a browser. Exporting nothing is what
 * makes that probe fail, so the fallback is chosen.
 */
export const ExpoSpeechRecognitionModule: undefined | {
 getPermissionsAsync:()=>Promise<{granted:boolean}>;
 requestPermissionsAsync:()=>Promise<{granted:boolean}>;
 start:(options:unknown)=>void;stop:()=>void;abort:()=>void;
}=undefined;
export const useSpeechRecognitionEvent = undefined;
