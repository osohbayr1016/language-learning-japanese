import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { colors, spacing, typography } from '../../theme';
export function MockExamAudioButton({ uri }: { uri: string }) {
  const ref = useRef<Audio.Sound | null>(null),
    generation = useRef(0);
  const [playing, setPlaying] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    generation.current++;
    setPlaying(false);
    setBusy(false);
    setError('');
    const old = ref.current;
    ref.current = null;
    void old?.unloadAsync();
    return () => {
      generation.current++;
      void ref.current?.unloadAsync();
      ref.current = null;
    };
  }, [uri]);
  const toggle = async () => {
    if (busy) return;
    const turn = generation.current;
    setBusy(true);
    setError('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (ref.current) {
        const state = await ref.current.getStatusAsync();
        if (state.isLoaded && state.isPlaying) {
          await ref.current.pauseAsync();
          setPlaying(false);
          return;
        }
        await ref.current.unloadAsync();
        ref.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
      );
      if (generation.current !== turn) {
        await sound.unloadAsync();
        return;
      }
      ref.current = sound;
      sound.setOnPlaybackStatusUpdate((s) => {
        if (generation.current === turn && s.isLoaded && s.didJustFinish)
          setPlaying(false);
      });
      await Promise.race([
        sound.playAsync(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(Error('Audio timeout')), 10000);
        }),
      ]);
      if (generation.current === turn) setPlaying(true);
    } catch {
      if (generation.current === turn) {
        setPlaying(false);
        setError(
          'Дуу тоглуулж чадсангүй. Холболтоо шалгаад дахин оролдоно уу.',
        );
      }
    } finally {
      if (timer) clearTimeout(timer);
      if (generation.current === turn) setBusy(false);
    }
  };
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Сорилын япон дуу сонсох"
        disabled={busy}
        onPress={() => void toggle()}
        style={{
          alignSelf: 'flex-start',
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 10,
          backgroundColor: colors.brand.secondary,
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Text
          style={{ ...typography.body.md, fontWeight: '600', color: '#fff' }}
        >
          {busy ? 'Ачаалж байна…' : playing ? 'Түр зогсоох' : '▶ Сонсох'}
        </Text>
      </Pressable>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, marginTop: 10 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
