import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { colors } from '../../theme';

export type PlayerHandle = {
  pause: () => Promise<void>;
  play: () => Promise<void>;
};

type Props = {
  uri: string;
  onTimeUpdate?: (sec: number) => void;
  onComplete?: () => void;
};

export const VideoPlayer = forwardRef<PlayerHandle, Props>(function VideoPlayer(
  { uri, onTimeUpdate, onComplete },
  ref
) {
  const videoRef = useRef<Video>(null);

  useImperativeHandle(ref, () => ({
    pause: async () => { await videoRef.current?.pauseAsync(); },
    play: async () => { await videoRef.current?.playAsync(); },
  }), []);

  const onStatus = (s: AVPlaybackStatus) => {
    if (!s.isLoaded) return;
    onTimeUpdate?.((s.positionMillis ?? 0) / 1000);
    if (s.didJustFinish) onComplete?.();
  };

  return (
    <View style={styles.wrap}>
      <Video
        ref={videoRef}
        source={{ uri }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        style={styles.video}
        onPlaybackStatusUpdate={onStatus}
        progressUpdateIntervalMillis={300}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { flex: 1, backgroundColor: colors.bg.primary },
});
