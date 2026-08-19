import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography, shadows } from "../../../theme";
import type { Book } from "./mockBooks";

type BookReaderProps = {
  book: Book;
  onFinish: () => void;
};

export function BookReader({ book, onFinish }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showKanji, setShowKanji] = useState(false);
  const [showRomaji, setShowRomaji] = useState(false);

  const page = book.pages[currentPage];
  const isLastPage = currentPage === book.pages.length - 1;

  const handleNext = () => {
    if (isLastPage) {
      onFinish();
    } else {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{book.title}</Text>
        <View style={styles.headerRight}>
          <Pressable
            style={[styles.toggleBtn, showRomaji && styles.toggleBtnActive]}
            onPress={() => setShowRomaji(!showRomaji)}
          >
            <Text style={[styles.toggleText, showRomaji && styles.toggleTextActive]}>
              Ромажи
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, showKanji && styles.toggleBtnActive]}
            onPress={() => setShowKanji(!showKanji)}
          >
            <Text style={[styles.toggleText, showKanji && styles.toggleTextActive]}>
              Ханз
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={page.image} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.textContainer}>
          {showRomaji && (
            <Text style={styles.romajiText}>{page.textRomaji}</Text>
          )}
          <Text style={styles.japaneseText}>
            {showKanji ? page.textKanji : page.textHiragana}
          </Text>
          <Text style={styles.translationText}>{page.translation}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.navBtn, currentPage === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={currentPage === 0}
        >
          <Ionicons name="arrow-back" size={24} color={currentPage === 0 ? colors.text.muted : colors.text.primary} />
        </Pressable>
        
        <Text style={styles.pageIndicator}>
          {currentPage + 1} / {book.pages.length}
        </Text>

        <Pressable style={styles.navBtnPrimary} onPress={handleNext}>
          <Text style={styles.navBtnPrimaryText}>
            {isLastPage ? "Дуусгах" : "Дараах"}
          </Text>
          {!isLastPage && <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} style={{ marginLeft: 8 }} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.default,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRight: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  title: {
    ...typography.heading.sm,
    color: colors.text.primary,
  },
  toggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.brand.primary + "20",
    borderColor: colors.brand.primary,
  },
  toggleText: {
    ...typography.body.sm,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: colors.brand.primary,
  },
  scrollContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  japaneseText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  romajiText: {
    ...typography.romaji.lg,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  translationText: {
    ...typography.body.lg,
    color: colors.text.secondary,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.elevated,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.default,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    height: 48,
  },
  navBtnPrimaryText: {
    ...typography.body.md,
    fontWeight: "700",
    color: colors.text.inverse,
  },
  pageIndicator: {
    ...typography.body.md,
    fontWeight: "600",
    color: colors.text.secondary,
  },
});
