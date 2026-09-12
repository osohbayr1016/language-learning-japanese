import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { api } from '../lib/api';

type PlayOpts = { speed?: 'normal' | 'slow'; repeat?: number };

type AudioCtx = {
  playWord: (wordId: number, opts?: PlayOpts) => Promise<void>;
  /** Бүтэн япон өгүүлбэр (жишээ өгүүлбэр) — API TTS */
  playPhrase: (text: string, opts?: PlayOpts) => Promise<void>;
  /** Монгол орчуулга — төхөөрөмжийн TTS (expo-speech) */
  playMeaningMn: (text: string) => Promise<void>;
  stop: () => Promise<void>;
};

const Ctx = createContext<AudioCtx | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
    return () => { void soundRef.current?.unloadAsync(); };
  }, []);

  const stop = async () => {
    try {
      Speech.stop();
    } catch {
      /* noop */
    }
    try { await soundRef.current?.stopAsync(); } catch { /* noop */ }
    try { await soundRef.current?.unloadAsync(); } catch { /* noop */ }
    soundRef.current = null;
  };

  const playOnceFromUri = async (uri: string) => {
    await stop();
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    soundRef.current = sound;
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) resolve();
      });
    });
  };

  const playWord: AudioCtx['playWord'] = async (wordId, opts) => {
    const speed = opts?.speed ?? 'normal';
    const repeat = Math.max(1, opts?.repeat ?? 1);
    const uri = api.audio.url(wordId, speed);
    for (let i = 0; i < repeat; i += 1) {
      try {
        await playOnceFromUri(uri);
      } catch (e) {
        console.warn('Audio playback failed', e);
        return;
      }
    }
  };

  const playPhrase: AudioCtx['playPhrase'] = async (text, opts) => {
    const speed = opts?.speed ?? 'normal';
    const repeat = Math.max(1, opts?.repeat ?? 1);
    const uri = api.audio.phraseUrl(text, speed);
    for (let i = 0; i < repeat; i += 1) {
      try {
        await playOnceFromUri(uri);
      } catch (e) {
        console.warn('Phrase audio failed', e);
        return;
      }
    }
  };

  const playMeaningMn: AudioCtx['playMeaningMn'] = async (text) => {
    const t = text.trim();
    if (!t) return;
    await stop();
    await new Promise<void>((resolve) => {
      Speech.speak(t, {
        language: 'mn-MN',
        pitch: 1,
        rate: 0.92,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  return <Ctx.Provider value={{ playWord, playPhrase, playMeaningMn, stop }}>{children}</Ctx.Provider>;
}

export function useAudio() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAudio must be used within AudioProvider');
  return c;
}
