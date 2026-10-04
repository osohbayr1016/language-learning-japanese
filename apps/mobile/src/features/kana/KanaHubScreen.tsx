import React, { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Screen } from '../../primitives';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../../lib/content/kanaTable';
import { KanaGlyphGrid } from './KanaGlyphGrid';
import { KanaWriteDialog } from './KanaWriteDialog';

export default function KanaHubScreen() {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);

  const closeDialog = useCallback(() => setPicked(null), []);

  return (
    <Screen scroll scrollBottomInset={70}>
      <View style={styles.header}>
        <Text style={styles.title}>{mn.kana.hubTitle}</Text>
        <Text style={styles.subtitle}>{mn.kana.hubSub}</Text>
      </View>

      <KanaGlyphGrid sectionTitle={mn.kana.hiragana} rows={HIRAGANA_ROWS} onPickChar={setPicked} />
      <KanaGlyphGrid sectionTitle={mn.kana.katakana} rows={KATAKANA_ROWS} onPickChar={setPicked} />

      <Card padding="lg" variant="elevated" style={styles.checkpointCard}>
        <Text style={styles.checkpointTitle}>Кана сууриа шалгах</Text>
        <Text style={styles.subtitle}>
          Хирагана, катаканагийн үндсэн тэмдэглэгээг таньж байвал богино checkpoint өгөөд N5 зам руу үргэлжлүүлээрэй.
        </Text>
        <Button
          label="Кана checkpoint эхлэх"
          onPress={() => router.push('/kana/checkpoint' as never)}
          style={styles.checkpointButton}
        />
      </Card>

      <KanaWriteDialog visible={picked !== null} glyph={picked ?? ''} onClose={closeDialog} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.soft.teal,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.secondary + '40',
  },
  title: {
    ...typography.heading.lg,
    color: colors.brand.secondary,
    marginBottom: 6,
  },
  subtitle: { ...typography.body.md, color: colors.text.secondary },
  checkpointCard: { marginTop: spacing.lg, marginBottom: spacing.lg },
  checkpointTitle: { ...typography.heading.md, color: colors.text.primary },
  checkpointButton: { marginTop: spacing.md },
});
