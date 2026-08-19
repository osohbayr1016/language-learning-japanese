import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import type { AVPlaybackStatus } from './expo-av';

type Props = {
  source: { uri: string };
  style?: React.CSSProperties;
  useNativeControls?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  shouldPlay?: boolean;
  isLooping?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  /** Native throttled its status callback; <video> timeupdate is ~4/s already. */
  progressUpdateIntervalMillis?: number;
};

export type VideoHandle = {
  playAsync: () => Promise<void>;
  pauseAsync: () => Promise<void>;
  stopAsync: () => Promise<void>;
  setPositionAsync: (millis: number) => Promise<void>;
};

/** expo-av's <Video> as a plain HTML <video>, controls and all. */
export const Video = forwardRef<VideoHandle, Props>(function Video(
  {
    source,
    style,
    useNativeControls = true,
    resizeMode = 'contain',
    shouldPlay,
    isLooping,
    onPlaybackStatusUpdate,
  },
  ref
) {
  const el = useRef<HTMLVideoElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      playAsync: async () => {
        await el.current?.play().catch(() => undefined);
      },
      pauseAsync: async () => {
        el.current?.pause();
      },
      stopAsync: async () => {
        if (!el.current) return;
        el.current.pause();
        el.current.currentTime = 0;
      },
      setPositionAsync: async (millis: number) => {
        if (el.current) el.current.currentTime = millis / 1000;
      },
    }),
    []
  );

  const report = (didJustFinish: boolean) => {
    const node = el.current;
    if (!node || !onPlaybackStatusUpdate) return;
    onPlaybackStatusUpdate({
      isLoaded: true,
      isPlaying: !node.paused,
      didJustFinish,
      positionMillis: node.currentTime * 1000,
      durationMillis: Number.isFinite(node.duration) ? node.duration * 1000 : undefined,
    });
  };

  return (
    <video
      ref={el}
      src={source.uri}
      controls={useNativeControls}
      autoPlay={shouldPlay}
      loop={isLooping}
      playsInline
      onTimeUpdate={() => report(false)}
      onEnded={() => report(true)}
      style={{ width: '100%', height: '100%', objectFit: resizeMode, ...style }}
    />
  );
});

export default Video;
