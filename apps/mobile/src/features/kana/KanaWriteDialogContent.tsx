import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { HanziWriterView } from '../../components/writing/HanziWriterView';
import type { HanziWriterHandle } from '../../components/writing/hanziWriterTypes';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { getKanaRomaji } from '../../lib/content/kanaRomaji';

const STROKE_DRAW = '#22C55E';
const OUTLINE_GHOST = '#D1D5DB';

type Props = {
  glyph: string;
  onClose: () => void;
};

function speakGlyph(c: string) {
  Speech.stop();
  Speech.speak(c, { language: 'ja-JP', rate: 0.88 });
}

export function KanaWriteDialogContent({ glyph, onClose }: Props) {
  const { width } = useWindowDimensions();
  const canvas = Math.min(Math.max(width - spacing.xl * 4, 200), 272);
  const writerRef = useRef<HanziWriterHandle>(null);
  const ch = Array.from(glyph.trim())[0] ?? '';
  const romajiEn = ch ? getKanaRomaji(ch) : '';

  const replayVisual = useCallback(() => writerRef.current?.reset(), []);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return (
    <View style={s.card} pointerEvents="box-none">
      <Pressable style={s.closeBtn} onPress={onClose} hitSlop={12} accessibilityRole="button">
        <Ionicons name="close-circle" size={28} color={colors.text.secondary} />
      </Pressable>

      <View style={s.glyphRow}>
        <Text style={s.glyphLarge}>{ch}</Text>
        {romajiEn ? <Text style={s.romajiEn}>{romajiEn}</Text> : null}
      </View>

      {ch ? (
        <View style={s.writerBox}>
          <HanziWriterView
            ref={writerRef}
            char={ch}
            mode="animate"
            size={canvas}
            strokeColor={STROKE_DRAW}
            outlineColor={OUTLINE_GHOST}
            strokeDataJp
          />
        </View>
      ) : null}

      <View style={s.actions}>
        <Pressable style={s.iconBtn} onPress={() => speakGlyph(ch)} accessibilityRole="button">
          <Ionicons name="volume-medium" size={22} color={colors.brand.primaryDark} />
          <Text style={s.iconBtnLabel}>{mn.kana.listen}</Text>
        </Pressable>
        <Pressable style={s.iconBtn} onPress={replayVisual}>
          <Ionicons name="refresh" size={20} color={colors.brand.primaryDark} />
          <Text style={s.iconBtnLabel}>{mn.kana.replay}</Text>
        </Pressable>
      </View>

      <Pressable style={s.primaryBtn} onPress={onClose}>
        <Text style={s.primaryBtnText}>{mn.kana.close}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xl + 8,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    ...shadows.md,
  },
  closeBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 2 },
  glyphRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  glyphLarge: {
    ...typography.heading.lg,
    color: colors.text.primary,
    includeFontPadding: false,
  },
  romajiEn: {
    ...typography.heading.md,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: colors.text.muted,
    textTransform: 'lowercase',
  },
  writerBox: { marginBottom: spacing.md },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.xs },
  iconBtnLabel: { ...typography.body.sm, fontWeight: '700', color: colors.brand.primaryDark },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    minWidth: 160,
    ...shadows.sm,
  },
  primaryBtnText: { ...typography.heading.sm, color: '#fff' },
});
