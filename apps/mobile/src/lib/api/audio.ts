import { getApiBase } from './client';

export const audio = {
  url: (wordId: number, speed: 'normal' | 'slow' = 'normal') =>
    `${getApiBase()}/api/audio/${wordId}?speed=${speed}`,
  /** Бүтэн өгүүлбэр (example_jp гэх мэт) — GET /api/audio/tts */
  phraseUrl: (text: string, speed: 'normal' | 'slow' = 'normal') =>
    `${getApiBase()}/api/audio/tts?text=${encodeURIComponent(text)}&speed=${speed}`,
};
