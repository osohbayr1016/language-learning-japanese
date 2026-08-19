import React, { useCallback, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HanziWriterView } from "../../components/writing/HanziWriterView";
import type { HanziWriterHandle } from "../../components/writing/hanziWriterTypes";
import { colors, radius, shadows, spacing, typography } from "../../theme";
import { mn } from "../../i18n/mn";

const closeLabel = mn.kana.close;

const STROKE_DRAW = "#22C55E";
const OUTLINE_GHOST = "#D1D5DB";

type Props = {
  kanji: string;
  romaji?: string;
  meaning?: string;
  onClose: () => void;
};

export function KanjiWriteDialogContent({
  kanji,
  romaji,
  meaning,
  onClose,
}: Props) {
  const { width } = useWindowDimensions();
  const canvas = Math.min(Math.max(width - spacing.xl * 4, 200), 272);
  const writerRef = useRef<HanziWriterHandle>(null);
  const glyph = Array.from(kanji.trim())[0] ?? "";

  const replay = useCallback(() => writerRef.current?.reset(), []);

  return (
    <View style={s.card} pointerEvents="box-none">
      <Pressable
        style={s.closeBtn}
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
      >
        <Ionicons name="close-circle" size={28} color={colors.text.secondary} />
      </Pressable>

      <Text style={s.glyph}>{glyph}</Text>

      {glyph ? (
        <View style={s.writerBox}>
          <HanziWriterView
            ref={writerRef}
            char={glyph}
            mode="animate"
            size={canvas}
            strokeColor={STROKE_DRAW}
            outlineColor={OUTLINE_GHOST}
            strokeDataJp
          />
        </View>
      ) : null}

      <Pressable style={s.replayBtn} onPress={replay}>
        <Ionicons name="refresh" size={18} color={colors.brand.primaryDark} />
        <Text style={s.replayLabel}>{mn.writer.watch}</Text>
      </Pressable>

      <View style={s.meta}>
        <Text style={s.romaji}>{romaji?.trim() ?? ""}</Text>
        <Text style={s.meaning}>{meaning ?? ""}</Text>
      </View>

      <Pressable style={s.primaryBtn} onPress={onClose}>
        <Text style={s.primaryBtnText}>{closeLabel}</Text>
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
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    ...shadows.md,
  },
  closeBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
  },
  glyph: {
    ...typography.heading.md,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  writerBox: { marginBottom: spacing.sm },
  replayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  replayLabel: {
    ...typography.body.sm,
    fontWeight: "700",
    color: colors.brand.primaryDark,
  },
  meta: { width: "100%", gap: 4, marginBottom: spacing.lg },
  romaji: {
    ...typography.heading.sm,
    color: colors.brand.primary,
    textAlign: "center",
  },
  meaning: {
    ...typography.body.md,
    color: colors.text.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryBtn: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    minWidth: 160,
    ...shadows.sm,
  },
  primaryBtnText: { ...typography.heading.sm, color: "#fff" },
});
