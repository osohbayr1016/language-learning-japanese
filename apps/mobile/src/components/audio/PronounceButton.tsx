import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudio } from '../../context/AudioContext';
import { colors } from '../../theme';
import { gestureToAction, type GestureKind } from '../../lib/audio/engine';
import { pronounceButtonStyles as styles } from './pronounceButtonStyles';

type Props = {
  wordId?: number;
  /** Standalone Japanese text for local content that has no server word id. */
  phraseText?: string;
  /** Монгол орчуулгыг төхөөрөмжөөр унших */
  meaningMn?: string;
  /** Гол үгийн ханз; displayText-тэй хамт өгөгдөхөд өгүүлбэрийн дуу сонсогдоно */
  wordHanzi?: string;
  /** Картад харуулж буй бүтэн текст (жишээ өгүүлбэр) */
  displayText?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
  showHints?: boolean;
};

/** Two taps inside this window count as a double tap (repeat playback). */
const DOUBLE_TAP_MS = 280;
/** Holding this long plays the slow version. */
const HOLD_MS = 380;

/**
 * Tap = play, double tap = repeat ×3, hold = slow.
 *
 * Built on a plain Pressable so the same component runs on iOS, Android and
 * in the browser. The previous version used react-native-gesture-handler's
 * Gesture API, which has no browser implementation — every screen with a
 * speaker button (learn, speak, flashcards) crashed on the website.
 */
export function PronounceButton({
  wordId,
  phraseText,
  meaningMn: _meaningMn,
  wordHanzi,
  displayText,
  size = 'md',
  color = colors.accent.purple,
  style,
  showHints = false,
}: Props) {
  const { playWord, playPhrase } = useAudio();
  const [active, setActive] = useState<'idle' | 'tap' | 'hold' | 'doubleTap'>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    []
  );

  const standalonePhrase = phraseText?.trim() || '';
  const useFullPhrase =
    typeof displayText === 'string' &&
    typeof wordHanzi === 'string' &&
    displayText.trim().length > 0 &&
    displayText.trim() !== wordHanzi.trim();

  const handle = async (kind: GestureKind) => {
    setActive(kind);
    setAudioError(null);
    const a = gestureToAction(kind);
    const opts =
      a.kind === 'doubleTap' ? { speed: a.speed, repeat: a.repeat } : { speed: a.speed };
    try {
      const ok = standalonePhrase
        ? await playPhrase(standalonePhrase, opts)
        : useFullPhrase
          ? await playPhrase(displayText!.trim(), opts)
          : typeof wordId === 'number'
            ? a.kind === 'doubleTap'
              ? await playWord(wordId, { speed: a.speed, repeat: a.repeat })
              : await playWord(wordId, { speed: a.speed })
            : false;
      if (!ok) setAudioError('Дууг тоглуулж чадсангүй. Дахин оролдоно уу.');
    } finally {
      setActive('idle');
    }
  };

  const onPress = () => {
    if (heldRef.current) {
      heldRef.current = false;
      return;
    }
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      void handle('doubleTap');
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      void handle('tap');
    }, DOUBLE_TAP_MS);
  };

  const onLongPress = () => {
    heldRef.current = true;
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
    }
    void handle('hold');
  };

  const dim: Record<string, number> = { sm: 36, md: 48, lg: 64 };
  const iconSize: Record<string, number> = { sm: 18, md: 22, lg: 30 };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Дуудлага сонсох"
          accessibilityHint="Хоёр дарвал давтана, удаан барихад удаан уншина"
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={HOLD_MS}
          style={({ pressed }: { pressed: boolean }) => [
            styles.btn,
            { width: dim[size], height: dim[size], backgroundColor: color },
            active === 'hold' && styles.holdGlow,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <Ionicons
            name={active === 'hold' ? 'play' : 'volume-high'}
            size={iconSize[size]}
            color={colors.text.inverse}
          />
          {active === 'hold' ? <Text style={styles.badge}>удаан</Text> : null}
        </Pressable>
      </View>
      {audioError ? (
        <Text accessibilityRole="alert" style={[styles.hint, { color: colors.error }]}>
          {audioError}
        </Text>
      ) : showHints ? (
        <Text style={styles.hint}>тап · удаан барих · 2 дарах</Text>
      ) : null}
    </View>
  );
}
