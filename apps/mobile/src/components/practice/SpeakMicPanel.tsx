import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { mn } from '../../i18n/mn';
import { colors, radius, spacing, typography } from '../../theme';

type Props = {
  disabled: boolean;
  submitted: boolean;
  processing: boolean;
  activeMic: boolean;
  onMicPress: () => void;
  liveTranscript: string;
  outcome: string;
  errorMessage: string | null;
  /** Override default MN helper while mic is live. */
  listeningHint?: string;
  liveTranscriptLabel?: string;
};

/**
 * The microphone control for every speaking exercise.
 *
 * Three states the learner can tell apart at a glance: idle (plum mic), live
 * (red stop button with a pulsing halo and the recogniser's running transcript
 * in a box), and done (the score block). Before, the live transcript was glued
 * into a helper sentence and the halo did not exist, so it was hard to know
 * whether the app was actually listening.
 */
export function SpeakMicPanel({
  disabled,
  submitted,
  processing,
  activeMic,
  onMicPress,
  liveTranscript,
  outcome,
  errorMessage,
  listeningHint,
  liveTranscriptLabel,
}: Props) {
  const hintWhileListening = listeningHint ?? mn.study.speakListeningHint;
  const liveLbl = liveTranscriptLabel ?? mn.study.speakLiveLabel;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activeMic) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeMic, pulse]);

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const inert = disabled || submitted || processing;

  return (
    <View style={styles.micWrap}>
      <View style={styles.micStage}>
        {activeMic ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.halo, { transform: [{ scale: haloScale }], opacity: haloOpacity }]}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activeMic ? 'Зогсоох' : 'Микрофон'}
          accessibilityState={{ disabled: inert, busy: processing }}
          disabled={inert}
          onPress={onMicPress}
          style={({ pressed }: { pressed: boolean }) => [
            styles.mic,
            { backgroundColor: activeMic ? colors.error : colors.brand.primary },
            inert && !activeMic && styles.micInert,
            pressed && styles.pressed,
            Platform.OS === 'web' && styles.micWeb,
          ]}
        >
          <View pointerEvents="none" accessible={false}>
            <Ionicons name={activeMic ? 'stop' : processing ? 'hourglass' : 'mic'} size={36} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      {activeMic ? (
        <>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveState}>{hintWhileListening}</Text>
          </View>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>{liveLbl}</Text>
            <Text style={[styles.transcript, !liveTranscript && styles.transcriptEmpty]}>
              {liveTranscript || '…'}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.helper}>{processing ? mn.study.speakProcessing : outcome}</Text>
      )}
      {errorMessage ? (
        <View style={styles.errorRow} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.error}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  micWrap: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  micStage: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.error,
  },
  mic: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  micInert: { opacity: 0.5 },
  micWeb: { cursor: 'pointer' as const },
  pressed: { transform: [{ scale: 0.97 }] },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  liveState: { ...typography.body.sm, fontWeight: '700', color: colors.error },
  transcriptBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.bg.washi,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  transcriptLabel: { ...typography.overline, color: colors.text.muted },
  transcript: { ...typography.heading.md, color: colors.text.primary, textAlign: 'center' },
  transcriptEmpty: { color: colors.text.faint },
  helper: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  error: { ...typography.body.sm, color: colors.error, textAlign: 'center' },
});
