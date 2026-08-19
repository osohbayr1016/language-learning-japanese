/** expo-speech on the browser SpeechSynthesis API. */
type Opts = { language?: string; rate?: number; pitch?: number; onDone?: () => void };

export function speak(text: string, options: Opts = {}): void {
  try {
    const u = new SpeechSynthesisUtterance(text);
    if (options.language) u.lang = options.language;
    if (options.rate != null) u.rate = options.rate;
    if (options.pitch != null) u.pitch = options.pitch;
    if (options.onDone) u.onend = () => options.onDone?.();
    speechSynthesis.speak(u);
  } catch {
    options.onDone?.();
  }
}
export function stop(): void {
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
export async function isSpeakingAsync(): Promise<boolean> {
  try {
    return speechSynthesis.speaking;
  } catch {
    return false;
  }
}
export async function getAvailableVoicesAsync() {
  try {
    return speechSynthesis.getVoices();
  } catch {
    return [];
  }
}
