/**
 * The slice of expo-av the app actually uses: load a URI, play it once, stop.
 * Backed by a plain HTMLAudioElement.
 */
type Status = { isLoaded: boolean; didJustFinish?: boolean; isPlaying?: boolean };
type StatusCb = (s: Status) => void;

class WebSound {
  private el: HTMLAudioElement;
  private onStatus: StatusCb | null = null;

  constructor(uri: string, shouldPlay: boolean) {
    this.el = new Audio(uri);
    this.el.preload = 'auto';
    this.el.addEventListener('ended', () =>
      this.onStatus?.({ isLoaded: true, didJustFinish: true, isPlaying: false })
    );
    if (shouldPlay) void this.el.play().catch(() => undefined);
  }
  setOnPlaybackStatusUpdate(cb: StatusCb | null) {
    this.onStatus = cb;
  }
  async playAsync() {
    await this.el.play().catch(() => undefined);
  }
  async stopAsync() {
    this.el.pause();
    this.el.currentTime = 0;
  }
  async unloadAsync() {
    this.el.pause();
    this.el.removeAttribute('src');
    this.el.load();
  }
  async setRateAsync(rate: number) {
    this.el.playbackRate = rate;
  }
}

export const Audio = {
  Sound: {
    createAsync: async (
      source: { uri: string },
      initial?: { shouldPlay?: boolean }
    ): Promise<{ sound: WebSound; status: Status }> => {
      const sound = new WebSound(source.uri, initial?.shouldPlay ?? false);
      return { sound, status: { isLoaded: true } };
    },
  },
  /** Native audio-session config; the browser has no equivalent knob. */
  setAudioModeAsync: async (): Promise<void> => {},
};

export type Sound = WebSound;
export const ResizeMode = { CONTAIN: 'contain', COVER: 'cover', STRETCH: 'stretch' } as const;
export type AVPlaybackStatus = Status & { positionMillis?: number; durationMillis?: number };

export { Video, type VideoHandle } from './expo-av-video';
